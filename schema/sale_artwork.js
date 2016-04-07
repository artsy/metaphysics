import {
  assign,
  compact,
} from 'lodash';
import cached from './fields/cached';
import date from './fields/date';
import money, { amount } from './fields/money';
import gravity from '../lib/loaders/gravity';
import Artwork from './artwork';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

const SaleArtworkType = new GraphQLObjectType({
  name: 'SaleArtwork',
  fields: () => {
    return {
      cached,
      _id: {
        type: GraphQLString,
      },
      id: {
        type: GraphQLString,
      },
      sale_id: {
        type: GraphQLString,
      },
      position: {
        type: GraphQLInt,
      },
      lot_number: {
        type: GraphQLString,
      },
      currency: {
        type: GraphQLString,
        description: 'Currency abbreviation (e.g. "USD")',
      },
      symbol: {
        type: GraphQLString,
        description: 'Currency symbol (e.g. "$")',
      },
      reserve_status: {
        type: GraphQLString,
      },
      is_with_reserve: {
        type: GraphQLBoolean,
        resolve: ({ reserve_status }) => reserve_status !== 'no_reserve',
      },
      is_bid_on: {
        type: GraphQLBoolean,
        resolve: ({ bidder_positions_count }) => bidder_positions_count !== 0,
      },
      reserve_message: {
        type: GraphQLString,
        resolve: ({ bidder_positions_count, reserve_status }) => {
          if (reserve_status === 'reserve_met') {
            return 'Reserve met';
          } else if (bidder_positions_count === 0 && reserve_status === 'reserve_not_met') {
            return 'This work has a reserve';
          }
          return null;
        },
      },
      reserve: money({
        name: 'SaleArtworkReserve',
        resolve: ({ reserve_cents }) => reserve_cents,
      }),
      low_estimate: money({
        name: 'SaleArtworkLowEstimate',
        resolve: ({ low_estimate_cents }) => low_estimate_cents,
      }),
      high_estimate: money({
        name: 'SaleArtworkHighEstimate',
        resolve: ({ high_estimate_cents }) => high_estimate_cents,
      }),
      opening_bid: money({
        name: 'SaleArtworkOpeningBid',
        resolve: ({ opening_bid_cents }) => opening_bid_cents,
      }),
      minimum_next_bid: money({
        name: 'SaleArtworkMinimumNextBid',
        resolve: ({ minimum_next_bid_cents }) => minimum_next_bid_cents,
      }),
      current_bid: money({
        name: 'SaleArtworkCurrentBid',
        resolve: ({ highest_bid_amount_cents, opening_bid_cents }) =>
          highest_bid_amount_cents || opening_bid_cents,
      }),
      highest_bid: {
        type: new GraphQLObjectType({
          name: 'SaleArtworkHighestBid',
          fields: {
            id: {
              type: GraphQLString,
            },
            created_at: date,
            is_cancelled: {
              type: GraphQLBoolean,
              resolve: ({ cancelled }) => cancelled,
            },
            amount: amount(({ amount_cents }) => amount_cents),
            cents: {
              type: GraphQLInt,
              resolve: ({ amount_cents }) => amount_cents,
            },
            amount_cents: {
              type: GraphQLInt,
              deprecationReason: 'Favor `cents`',
            },
          },
        }),
        resolve: ({ symbol, highest_bid }) =>
          assign({ symbol }, highest_bid),
      },
      artwork: {
        type: Artwork.type,
        resolve: ({ artwork }) => artwork,
      },
      estimate: {
        type: GraphQLString,
        resolve: ({
          display_low_estimate_dollars,
          display_high_estimate_dollars,
          display_estimate_dollars,
        }) => {
          return compact([
            display_low_estimate_dollars,
            display_high_estimate_dollars,
          ]).join('–') || display_estimate_dollars;
        },
      },
      counts: {
        resolve: x => x,
        type: new GraphQLObjectType({
          name: 'SaleArtworkCounts',
          fields: {
            bidder_positions: {
              type: GraphQLInt,
              resolve: ({ bidder_positions_count }) => bidder_positions_count,
            },
          },
        }),
      },
      low_estimate_cents: {
        type: GraphQLInt,
        deprecationReason: 'Favor `low_estimate`',
      },
      high_estimate_cents: {
        type: GraphQLInt,
        deprecationReason: 'Favor `high_estimate',
      },
      opening_bid_cents: {
        type: GraphQLInt,
        deprecationReason: 'Favor `opening_bid`',
      },
      minimum_next_bid_cents: {
        type: GraphQLInt,
        deprecationReason: 'Favor `minimum_next_bid`',
      },
      bidder_positions_count: {
        type: GraphQLInt,
        deprecationReason: 'Favor `counts.bidder_positions`',
      },
    };
  },
});

const SaleArtwork = {
  type: SaleArtworkType,
  description: 'A Sale Artwork',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the SaleArtwork',
    },
  },
  resolve: (root, { id }) => {
    return gravity(`sale_artwork/${id}`);
  },
};

export default SaleArtwork;
