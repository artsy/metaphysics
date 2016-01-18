import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import date from './fields/date';
import SaleArtwork from './sale_artwork';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

const SaleType = new GraphQLObjectType({
  name: 'Sale',
  fields: () => {
    return {
      cached,
      id: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      href: {
        type: GraphQLString,
        resolve: ({ id }) => `/auction/${id}`,
      },
      description: {
        type: GraphQLString,
      },
      sale_type: {
        type: GraphQLString,
      },
      is_auction: {
        type: GraphQLString,
      },
      auction_state: {
        type: GraphQLString,
      },
      start_at: date,
      end_at: date,
      currency: {
        type: GraphQLString,
      },
      sale_artworks: {
        type: new GraphQLList(SaleArtwork.type),
        resolve: ({ id }, options) => gravity(`sale/${id}/sale_artworks`, options),
      },
    };
  },
});

const Sale = {
  type: SaleType,
  description: 'A Sale',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Sale',
    },
  },
  resolve: (root, { id }) => gravity(`sale/${id}`),
};

export default Sale;
