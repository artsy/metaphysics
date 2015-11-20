import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import date from './fields/date';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList
} from 'graphql';

let SaleType = new GraphQLObjectType({
  name: 'Sale',
  fields: () => {
    let SaleArtwork = require('./sale_artwork');

    return {
      cached: cached,
      id: {
        type: GraphQLString
      },
      name: {
        type: GraphQLString
      },
      description: {
        type: GraphQLString
      },
      sale_type: {
        type: GraphQLString
      },
      is_auction: {
        type: GraphQLString
      },
      start_at: date,
      end_at: date,
      currency: {
        type: GraphQLString
      },
      sale_artworks: {
        type: new GraphQLList(SaleArtwork.type),
        resolve: ({ id }, options) => gravity(`sale/${id}/sale_artworks`, options)
      }
    }
  }
});

let Sale = {
  type: SaleType,
  description: 'A Sale',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Sale'
    }
  },
  resolve: (root, { id }) => gravity(`sale/${id}`)
};

export default Sale;
