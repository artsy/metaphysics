import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import date from './fields/date';
import SaleArtwork from './sale_artwork';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
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
        type: GraphQLBoolean,
      },
      is_auction_promo: {
        type: GraphQLBoolean,
        resolve: ({ sale_type }) => sale_type === 'auction promo',
      },
      is_preview: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === 'preview',
      },
      is_open: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === 'open',
      },
      is_closed: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === 'closed',
      },
      is_with_buyers_premium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => buyers_premium,
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
      sale_artwork: {
        type: SaleArtwork.type,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (sale, { id }) => {
          return gravity(`sale/${sale.id}/sale_artwork/${id}`);
        },
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
