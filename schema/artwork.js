import _ from 'lodash';
import qs from 'qs';
import Image from './image';
import Sale from './sale';
import Partner from './partner';
import gravity from '../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

export let ArtworkPredicates = {
  is_contactable: (artwork, sales) => {
    return artwork.forsale && !_.isEmpty(artwork.partner) && !artwork.acquireable && !sales.length
  },
  is_in_auction: (artwork, sales) => {
    return _.any(sales, 'is_auction')
  }
}

let ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => {
    let Artist = require('./artist');

    return {
      cached: {
        type: GraphQLInt,
        resolve: ({ cached }) => new Date().getTime() - cached
      },
      id: {
        type: GraphQLString
      },
      href: {
        type: GraphQLString,
        resolve: (artwork) => `/artwork/${artwork.id}`
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
      partner:{
        type: Partner.type,
        resolve: (artwork) => {
          return artwork.partner
        }
      },
      is_contactable: {
        type: GraphQLBoolean,
        description: 'Are we able to display a contact form on artwork pages?',
        resolve: (artwork) => {
          return new Promise(resolve => {
            gravity(`related/sales`, { size: 1, active: true, artwork: [id] })
              .then(sales => {
                resolve(ArtworkPredicates.is_contactable(artwork, sales))
              });
          });
        }
      },
      is_in_auction: {
        type: GraphQLBoolean,
        description: 'Is this artwork part of an auction?',
        resolve: (artwork) => {
          return new Promise(resolve => {
            gravity(`related/sales`, { size: 1, active: true, artwork: [artwork.id] })
              .then(sales => {
                resolve(ArtworkPredicates.is_in_auction(artwork, sales))
              });
          });
        }
      },
      artist: {
        type: Artist.type,
        resolve: ({ artist }) => gravity(`artist/${artist.id}`)
      },
      dimensions: {
        type: new GraphQLObjectType({
          name: 'dimensions',
          fields: {
            in: { type: GraphQLString },
            cm: { type: GraphQLString }
          }
        })
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
            type: GraphQLInt
          }
        },
        resolve: ({ id }, options) => gravity(`related/sales`, _.defaults(options, {
          size: 1,
          active: true,
          artwork: [id]
        }))
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
