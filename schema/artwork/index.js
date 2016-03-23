import _ from 'lodash';
import {
  isTwoDimensional,
  isTooBig,
} from './utilities';
import {
  enhance,
} from '../../lib/helpers';
import cached from '../fields/cached';
import markdown from '../fields/markdown';
import Artist from '../artist';
import Image from '../image';
import Fair from '../fair';
import Sale from '../sale/index';
import PartnerShow from '../partner_show';
import Partner from '../partner';
import Related from './related';
import Highlight from './highlight';
import Tabs from './tabs';
import Dimensions from '../dimensions';
import EditionSet from '../edition_set';
import gravity from '../../lib/loaders/gravity';
import positron from '../../lib/loaders/positron';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => {
    return {
      cached,
      id: {
        type: GraphQLString,
      },
      _id: {
        type: GraphQLString,
      },
      to_s: {
        type: GraphQLString,
        resolve: ({ artist, title, date, partner }) => {
          return _.compact([
            (artist && artist.name),
            (title && `‘${title}’`),
            date,
            (partner && partner.name),
          ]).join(', ');
        },
      },
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `/artwork/${id}`,
      },
      title: {
        type: GraphQLString,
      },
      category: {
        type: GraphQLString,
      },
      medium: {
        type: GraphQLString,
      },
      date: {
        type: GraphQLString,
      },
      image_rights: {
        type: GraphQLString,
      },
      series: {
        type: GraphQLString,
      },
      manufacturer: {
        type: GraphQLString,
      },
      website: {
        type: GraphQLString,
      },
      partner: {
        type: Partner.type,
        resolve: ({ partner }) => gravity(`partner/${partner.id}`),
      },
      can_share_image: {
        type: GraphQLBoolean,
        deprecationReason: 'Favor `is_`-prefixed boolean attributes',
      },
      is_shareable: {
        type: GraphQLBoolean,
        resolve: ({ can_share_image }) => can_share_image,
      },
      is_hangable: {
        type: GraphQLBoolean,
        resolve: (artwork) => {
          return (
            !_.includes(artwork.category, 'sculpture', 'installation', 'design') &&
            isTwoDimensional(artwork) &&
            !isTooBig(artwork)
          );
        },
      },
      is_contactable: {
        type: GraphQLBoolean,
        description: 'Are we able to display a contact form on artwork pages?',
        resolve: (artwork) => {
          return gravity('related/sales', { size: 1, active: true, artwork: [artwork.id] })
            .then(sales => {
              return (
                artwork.forsale &&
                !_.isEmpty(artwork.partner) &&
                !artwork.acquireable &&
                !sales.length
              );
            }).catch(() => false);
        },
      },
      is_in_auction: {
        type: GraphQLBoolean,
        description: 'Is this artwork part of an auction?',
        resolve: ({ id }) => {
          return gravity(`related/sales`, { size: 1, active: true, artwork: [id] })
            .then(sales => _.some(sales, 'is_auction'));
        },
      },
      is_for_sale: {
        type: GraphQLBoolean,
        resolve: ({ forsale }) => forsale,
      },
      is_unique: {
        type: GraphQLBoolean,
        resolve: ({ unique }) => unique,
      },
      is_sold: {
        type: GraphQLBoolean,
        resolve: ({ sold }) => sold,
      },
      is_ecommerce: {
        type: GraphQLBoolean,
        resolve: ({ ecommerce }) => ecommerce,
      },
      is_comparable_with_auction_results: {
        type: GraphQLBoolean,
        resolve: ({ comparables_count, category }) => {
          return (
            comparables_count > 0 &&
            category !== 'Architecture'
          );
        },
      },
      sale_message: {
        type: GraphQLString,
        resolve: ({ availability, price_hidden, price, sale_message }) => {
          if (availability === 'for sale' && price_hidden) return 'Contact For Price';
          if (sale_message !== 'Sold') return price || sale_message;
        },
      },
      artist: {
        type: Artist.type,
        resolve: ({ artist }) => gravity(`artist/${artist.id}`).catch(() => null),
      },
      contact_label: {
        type: GraphQLString,
        resolve: ({ partner }) => {
          return (partner.type === 'Gallery') ? 'Gallery' : 'Seller';
        },
      },
      cultural_maker: {
        type: GraphQLString,
      },
      artists: {
        type: new GraphQLList(Artist.type),
        resolve: ({ artists }) => {
          return Promise.all(
            artists.map(artist => gravity(`/artist/${artist.id}`))
          ).catch(() => []);
        },
      },
      dimensions: Dimensions,
      image: {
        type: Image.type,
        resolve: ({ images }) => {
          return Image.resolve(_.find(images, { is_default: true }) || _.first(images));
        },
      },
      images: {
        type: new GraphQLList(Image.type),
        args: {
          size: {
            type: GraphQLInt,
          },
        },
        resolve: ({ images }, { size }) => {
          const sorted = _.sortBy(images, 'position');
          return Image.resolve(size ? _.take(sorted, size) : sorted);
        },
      },
      related: {
        type: Related,
        description: 'Returns the associated Fair or Sale',
        resolve: ({ id }) => {
          const options = { artwork: [id], active: true, size: 1 };
          return Promise.all([
            gravity('related/fairs', options),
            gravity('related/sales', options),
          ]).then(([fairs, sales]) => {
            const relatedFairs = enhance(fairs, { related_type: 'Fair' });
            const relatedSales = enhance(sales, { related_type: 'Sale' });
            return _.first(_.take(relatedFairs.concat(relatedSales)));
          });
        },
      },
      highlights: {
        type: new GraphQLList(Highlight),
        description: 'Returns the highlighted shows and articles',
        resolve: ({ id, _id }) => {
          return Promise.all([
            gravity('related/shows', { artwork: [id], active: true, size: 1 }),
            positron('articles', { artwork_id: _id, published: true, limit: 1 })
              .then(articles => articles.results),
          ]).then(([shows, articles]) => {
            const highlightedShows = enhance(shows, { highlight_type: 'Show' });
            const highlightedArticles = enhance(articles, { highlight_type: 'Article' });
            return highlightedShows.concat(highlightedArticles);
          });
        },
      },
      shows: {
        type: new GraphQLList(PartnerShow.type),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 1,
          },
          active: {
            type: GraphQLBoolean,
            defaultValue: true,
          },
        },
        resolve: ({ id }, options) => {
          return gravity('related/shows', _.defaults(options, { artwork: [id] }));
        },
      },
      sale: {
        type: Sale.type,
        resolve: ({ id }) => {
          return gravity('related/sales', { artwork: [id], active: true, size: 1 })
            .then(sales => _.first(sales));
        },
      },
      fair: {
        type: Fair.type,
        resolve: ({ id }) => {
          return gravity('related/fairs', { artwork: [id], active: true, size: 1 })
            .then(fairs => _.first(fairs));
        },
      },
      edition_of: {
        type: GraphQLString,
        resolve: ({ unique, edition_sets }) => {
          if (unique) return 'Unique';
          if (edition_sets && edition_sets.length === 1) {
            return _.first(edition_sets).editions;
          }
        },
      },
      edition_sets: {
        type: new GraphQLList(EditionSet.type),
        resolve: ({ edition_sets }) => {
          return _.filter(edition_sets, { acquireable: true });
        },
      },
      description: markdown('blurb'),
      provenance: markdown(),
      exhibition_history: markdown(),
      signature: markdown(),
      additional_information: markdown(),
      bibliography: markdown('literature'),
      tabs: Tabs,
    };
  },
});

const Artwork = {
  type: ArtworkType,
  description: 'An Artwork',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Artwork',
    },
  },
  resolve: (root, { id }) => gravity(`artwork/${id}`),
};

export default Artwork;
