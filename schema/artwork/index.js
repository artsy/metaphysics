import _ from 'lodash';
import {
  isTwoDimensional,
  isTooBig,
} from './utilities';
import cached from '../fields/cached';
import Artist from '../artist';
import Image from '../image';
import Fair from '../fair';
import Sale from '../sale';
import PartnerShow from '../partner_show';
import Partner from '../partner';
import RelatedType from './related';
import gravity from '../../lib/loaders/gravity';
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
            });
        },
      },
      is_in_auction: {
        type: GraphQLBoolean,
        description: 'Is this artwork part of an auction?',
        resolve: ({ id }) => {
          return gravity(`related/sales`, { size: 1, active: true, artwork: [id] })
            .then(sales => _.any(sales, 'is_auction'));
        },
      },
      sale_message: {
        type: GraphQLString,
      },
      artist: {
        type: Artist.type,
        resolve: ({ artist }) => gravity(`artist/${artist.id}`),
      },
      contact_label: {
        type: GraphQLString,
        resolve: ({ partner }) => {
          return (partner.type === 'Gallery') ? 'Gallery' : 'Seller';
        },
      },
      artists: {
        type: new GraphQLList(Artist.type),
        resolve: ({ artists }) => {
          return Promise.all(
            artists.map(artist => gravity(`/artist/${artist.id}`))
          );
        },
      },
      dimensions: {
        type: new GraphQLObjectType({
          name: 'dimensions',
          fields: {
            in: {
              type: GraphQLString,
            },
            cm: {
              type: GraphQLString,
            },
          },
        }),
      },
      image: {
        type: Image.type,
        resolve: ({ images }) => {
          return Image.resolve(_.findWhere(images, { is_default: true }) || _.first(images));
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
          return Image.resolve(size ? _.take(images, size) : images);
        },
      },
      related: {
        type: RelatedType,
        description: 'Returns the associated Fair or Sale',
        resolve: ({ id }) => {
          const options = { artwork: [id], active: true, size: 1 };
          return Promise.all([
            gravity('related/fairs', options),
            gravity('related/sales', options),
          ]).then(([fairs, sales]) => {
            fairs.map(fair => fair.related_type = 'Fair'); // eslint-disable-line no-param-reassign
            sales.map(sale => sale.related_type = 'Sale'); // eslint-disable-line no-param-reassign
            return _.first(_.take(fairs.concat(sales)));
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
      sales: {
        type: new GraphQLList(Sale.type),
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
          return gravity('related/sales', _.defaults(options, { artwork: [id] }));
        },
      },
      fairs: {
        type: new GraphQLList(Fair.type),
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
          return gravity('related/fairs', _.defaults(options, { artwork: [id] }));
        },
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
