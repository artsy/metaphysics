import _ from 'lodash';
import qs from 'qs';
import cached from './fields/cached';
import Image from './image';
import Sale from './sale';
import Partner from './partner';
import Artist from './artist';
import gravity from '../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

let ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => {
    return {
      cached: cached,
      id: {
        type: GraphQLString
      },
      _id: {
        type: GraphQLString
      },
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `/artwork/${id}`
      },
      title: {
        type: GraphQLString
      },
      category: {
        type: GraphQLString
      },
      medium: {
        type: GraphQLString
      },
      date: {
        type: GraphQLString
      },
      can_share_image: {
        type: GraphQLBoolean
      },
      partner:{
        type: Partner.type,
        resolve: ({ partner }) => gravity(`partner/${partner.id}`)
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
        }
      },
      is_in_auction: {
        type: GraphQLBoolean,
        description: 'Is this artwork part of an auction?',
        resolve: ({ id }) => {
          return gravity(`related/sales`, { size: 1, active: true, artwork: [id] })
            .then(sales => _.any(sales, 'is_auction'));
        }
      },
      sale_message: {
        type: GraphQLString
      },
      artist: {
        type: Artist.type,
        resolve: ({ artist }) => gravity(`artist/${artist.id}`)
      },
      contact_label: {
        type: GraphQLString,
        resolve: ({ partner }) => {
          if (partner.type == 'Gallery') {
            return 'Gallery';
          } else {
            return 'Seller';
          }
        }
      },
      artists: {
        type: new GraphQLList(Artist.type),
        resolve: ({ artists }) => {
          return Promise.all(
            artists.map(artist => gravity(`/artist/${artist.id}`))
          );
        }
      },
      dimensions: {
        type: new GraphQLObjectType({
          name: 'dimensions',
          fields: {
            in: {
              type: GraphQLString
            },
            cm: {
              type: GraphQLString
            }
          }
        })
      },
      image: {
        type: Image.type,
        resolve: ({ images }) => _.findWhere(images, { is_default: true }) || _.first(images)
      },
      images: {
        type: new GraphQLList(Image.type),
        args: {
          size: {
            type: GraphQLInt
          }
        },
        resolve: ({ images }, { size }) => {
          return size ? _.take(images, size) : images;
        }
      },
      sales: {
        type: new GraphQLList(Sale.type),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 1
          },
          active: {
            type: GraphQLBoolean,
            defaultValue: true
          }
        },
        resolve: ({ id }, options) => gravity('related/sales', _.defaults(options, { artwork: [id] }))
      }
    }
  }
});

let Artwork = {
  type: ArtworkType,
  description: 'An Artwork',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Artwork'
    }
  },
  resolve: (root, { id }) => gravity(`artwork/${id}`)
};

export default Artwork;
