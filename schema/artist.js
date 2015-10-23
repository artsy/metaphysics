import artsy from '../lib/artsy';
import Artwork from './artwork';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType
} from 'graphql';

let ArtistType = new GraphQLObjectType({
  name: 'Artist',
  fields: () => ({
    id: {
      type: GraphQLString
    },
    sortable_id: {
      type: GraphQLString,
      description: 'Use this attribute to sort by when sorting a collection of Artists'
    },
    name: {
      type: GraphQLString
    },
    birthday: {
      type: GraphQLString
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: {
        size: {
          type: GraphQLInt,
          description: 'The number of Artworks to return'
        },
        sort: {
          type: new GraphQLEnumType({
            name: 'ArtworkSorts',
            values: {
              'title_asc': { value: 'title' },
              'title_desc': { value: '-title' },
              'created_at_asc': { value: 'created_at' },
              'created_at_desc': { value: '-created_at' },
              'iconicity_desc': { value: '-iconicity' },
              'merchandisability_desc': { value: '-merchandisability' },
              'published_at_asc': { value: 'published_at' },
              'published_at_desc': { value: '-published_at' }
            }
          })
        }
      },
      resolve: ({ id }, { size, sort }) => {
        return artsy(['artist', id, 'artworks'], {
          published: true,
          size: size,
          sort: sort
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
