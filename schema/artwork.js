import _ from 'lodash';
import artsy from '../lib/artsy';
import Artist from './artist';
import Image from './image';
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
  fields: () => ({
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
        return artwork.forsale && !_.isEmpty(artwork.partner) && !artwork.acquireable;
      }
    },
    artist: {
      type: Artist.type,
      resolve: ({ artist }) => artsy(`artist/${artist.id}`)
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
  resolve: (root, { id }) => artsy(`artwork/${id}`)
};

export default Artwork;
