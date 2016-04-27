import _ from 'lodash';
import {
  isTwoDimensional,
  isTooBig,
} from './utilities';
import {
  enhance,
  existyValue,
} from '../../lib/helpers';
import cached from '../fields/cached';
import markdown from '../fields/markdown';
import Artist from '../artist';
import Image, { getDefault } from '../image';
import Fair from '../fair';
import Sale from '../sale/index';
import PartnerShow from '../partner_show';
import Partner from '../partner';
import Related from './related';
import Meta from './meta';
import Highlight from './highlight';
import Dimensions from '../dimensions';
import EditionSet from '../edition_set';
import ArtworkLayer from '../artwork_layer';
import ArtworkLayers from '../artwork_layers';
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
      website: {
        type: GraphQLString,
      },
      collecting_institution: {
        type: GraphQLString,
        resolve: ({ collecting_institution }) =>
          existyValue(collecting_institution),
      },
      partner: {
        type: Partner.type,
        args: {
          shallow: {
            type: GraphQLBoolean,
            description: 'Use whatever is in the original response instead of making a request',
          },
        },
        resolve: ({ partner }, { shallow }) => {
          if (shallow) return partner;
          return gravity(`partner/${partner.id}`);
        },
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
                !artwork.partner.has_limited_fair_partnership &&
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
      is_in_show: {
        type: GraphQLBoolean,
        description: 'Is this artwork part of a current show',
        resolve: ({ id }) =>
          gravity('related/shows', { active: true, size: 1, artwork: [id] })
            .then(shows => shows.length > 0),
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
        deprecationReason: 'Should not be used to determine anything UI-level',
        resolve: ({ ecommerce }) => ecommerce,
      },
      is_acquireable: {
        type: GraphQLBoolean,
        description: 'Whether work can be purchased through e-commerce',
        resolve: ({ acquireable }) => acquireable,
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
      is_downloadable: {
        type: GraphQLBoolean,
        resolve: ({ images }) => _.first(images).downloadable,
      },
      sale_message: {
        type: GraphQLString,
        resolve: ({ sold, availability, price_hidden, price, sale_message }) => {
          if (availability === 'for sale' && price_hidden) return 'Contact for price';
          if (sold) return 'Sold';
          if (sale_message !== 'Sold' && !price_hidden) return price;
          return sale_message;
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
        args: {
          shallow: {
            type: GraphQLBoolean,
            description: 'Use whatever is in the original response instead of making a request',
          },
        },
        resolve: ({ artists }, { shallow }) => {
          if (shallow) return artists;
          return Promise.all(
            artists.map(artist => gravity(`/artist/${artist.id}`))
          ).catch(() => []);
        },
      },
      dimensions: Dimensions,
      image: {
        type: Image.type,
        resolve: ({ images }) => {
          return Image.resolve(getDefault(images));
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
            gravity('related/shows', { artwork: [id], size: 1, at_a_fair: false }),
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
        resolve: ({ id }, { size, active }) =>
          gravity('related/shows', { size, active, artwork: [id] }),
      },
      sale: {
        type: Sale.type,
        resolve: ({ id }) =>
          gravity('related/sales', { artwork: [id], active: true, size: 1 })
            .then(_.first),
      },
      fair: {
        type: Fair.type,
        resolve: ({ id }) =>
          gravity('related/fairs', { artwork: [id], active: true, size: 1 })
            .then(_.first),
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
        resolve: ({ edition_sets }) => edition_sets,
      },
      description: markdown(({ blurb }) => blurb),
      exhibition_history: markdown(),
      provenance: markdown(({ provenance }) =>
        provenance.replace(/^provenance:\s+/i, '')
      ),
      signature: markdown(({ signature }) =>
        signature.replace(/^signature:\s+/i, '')
      ),
      additional_information: markdown(),
      literature: markdown(({ literature }) =>
        literature.replace(/^literature:\s+/i, '')
      ),
      publisher: markdown(),
      manufacturer: markdown(),
      series: markdown(),
      meta: Meta,
      layer: {
        type: ArtworkLayer.type,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (artwork, { id }) =>
          // There's no route in Gravity for an actual layer, interestingly.
          gravity(`related/layers`, { artwork: [artwork.id] })
            .then(layers => {
              const layer = _.find(layers, { id });
              if (layer) return _.assign({ artwork_id: artwork.id }, layer);
            }),
      },
      layers: {
        type: ArtworkLayers.type,
        resolve: ({ id }) =>
          gravity(`related/layers`, { artwork: [id] })
            .then(layers => enhance(layers, { artwork_id: id })),
      },
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
