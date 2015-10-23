import artsy from '../lib/artsy';
import Artwork from './artwork';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

let ArtistType = new GraphQLObjectType({
  name: 'Artist',
  fields: () => ({
    id: { type: GraphQLString },
    sortable_id: {
      type: GraphQLString,
      description: 'Use this attribute to sort by when sorting a collection of Artists'
    },
    name: { type: GraphQLString },
    birthday: { type: GraphQLString },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: { size: { type: GraphQLInt } },
      resolve: ({ id }, { size }) => {
        return artsy(['artist', id, 'artworks'], {
          published: true,
          size: size
        });
      }
    }
  })
});

let Artist = {
  type: ArtistType,
  description: 'An Artist',
  args: {
    id: {
      description: 'The slug or ID of the Artist',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, { id }) => artsy(['artist', id])
};

export default Artist;
