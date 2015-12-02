import googleCSE from '../../lib/loaders/google_cse';
import cached from '../fields/cached';
import SearchResult from './search_result';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

let SearchType = new GraphQLObjectType({
  name: 'Search',
  fields: () => ({
    cached: cached,
    total: {
      type: GraphQLInt,
      resolve: (response) => response.searchInformation.totalResults
    },
    results: {
      type: new GraphQLList(SearchResult.type),
      resolve: ({ items }) => items
    }
  })
});

let Search = {
  type: SearchType,
  description: 'A Search',
  args: {
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Your search term'
    }
  },
  resolve: (root, { term }) => googleCSE({ q: term })
};

export default Search;
