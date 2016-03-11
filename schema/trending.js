import delta from '../lib/loaders/delta';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import { keys } from 'lodash';
import Artist from './artist';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt
} from 'graphql';

const TrendingArtistsType = new GraphQLObjectType({
  name: 'TrendingArtists',
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: (results) => {
        let ids = keys(results).slice(0,-1);
        return Promise.all(
          ids.map(id => gravity(`/artist/${id}`))
        );
      },
    },
  }),
});

const TrendingArtists = {
  type: TrendingArtistsType,
  description: 'Trending artists',
  args: {
    method: {
      type: GraphQLString,
      description: 'Trending method',
      defaultValue: 'fetch',
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Trending metric name',
    },
    n: {
      type: GraphQLInt,
      description: 'Number of results to return',
      defaultValue: 40,
    },
  },
  resolve: (root, options) => delta('/', options),
};

export default TrendingArtists;
