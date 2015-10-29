import _ from 'lodash';
import qs from 'qs';
import Artist from './artist';
import Image from './image';
import Sale from './sale';
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
  }
};

let ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => ({
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
  })
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
