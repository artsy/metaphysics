import _ from 'lodash';
import artsy from '../lib/artsy';
import Artist from './artist';
import Image from './image';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList
} from 'graphql';

let ArtworkType = new GraphQLObjectType({
  name: 'Artwork',
  fields: () => ({
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    category: { type: GraphQLString },
    medium: { type: GraphQLString },
    date: { type: GraphQLString },
    is_contactable: {
      type: GraphQLBoolean,
      description: 'Are we able to display a contact form on artwork pages?',
      resolve: (artwork) => {
        return artwork.forsale && !_.isEmpty(artwork.partner) && !artwork.acquireable;
      }
    },
    artist: {
      type: Artist.type,
      resolve: ({ artist }) => {
        return artsy(['artist', artist.id])
      }
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
      resolve: ({ images }) => images
    }
  })
});

let Artwork = {
  type: ArtworkType,
  description: 'An Artwork',
  args: {
    id: {
      description: 'The slug or ID of the Artwork',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, { id }) => {
    return artsy(['artwork', id])
  }
};

export default Artwork;
