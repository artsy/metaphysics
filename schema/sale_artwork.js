import {
  assign,
  compact,
  find,
  times,
  last,
} from 'lodash';
import cached from './fields/cached';
import date from './fields/date';
import money, { amount } from './fields/money';
import numeral from './fields/numeral';
import gravity from '../lib/loaders/gravity';
import Artwork from './artwork';
import Sale from './sale';
import { GravityIDFields } from './object_identification';
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql';

const { BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT } = process.env;

export const isBiddable = (sale, { artwork: { sold } }) => {
  return (
    !sold &&
    sale.is_auction &&
    sale.auction_state === 'open'
  );
};

const SaleArtworkType = new GraphQLObjectType({
  name: 'SaleArtwork',
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
      sale_id: {
        type: GraphQLString,
      },
      sale: {
        type: Sale.type,
        resolve: ({ sale, sale_id }) => {
          if (!!sale) return sale;
          return gravity(`sale/${sale_id}`);
        },
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
      is_biddable: {
        type: GraphQLBoolean,
        description: 'Can bids be placed on the artwork?',
        resolve: saleArtwork => {
          if (!!saleArtwork.sale) {
            return isBiddable(saleArtwork.sale, saleArtwork);
          }

          return gravity(`sale/${saleArtwork.sale_id}`)
            .then(sale => isBiddable(sale, saleArtwork));
        },
      },
      reserve_message: {
        type: GraphQLString,
        resolve: ({ bidder_positions_count, reserve_status }) => {
          if (reserve_status === 'reserve_met') {
            return 'Reserve met';
          } else if (bidder_positions_count === 0 && reserve_status === 'reserve_not_met') {
            return 'This work has a reserve';
          } else if (bidder_positions_count > 0 && reserve_status === 'reserve_not_met') {
            return 'Reserve not met';
          }
          return null;
        },
      },
      reserve: money({
        name: 'SaleArtworkReserve',
        resolve: ({ display_reserve_dollars, reserve_cents }) => ({
          cents: reserve_cents,
          display: display_reserve_dollars,
        }),
      }),
      low_estimate: money({
        name: 'SaleArtworkLowEstimate',
        resolve: ({ display_low_estimate_dollars, low_estimate_cents }) => ({
          cents: low_estimate_cents,
          display: display_low_estimate_dollars,
        }),
      }),
      high_estimate: money({
        name: 'SaleArtworkHighEstimate',
        resolve: ({ display_high_estimate_dollars, high_estimate_cents }) => ({
          cents: high_estimate_cents,
          display: display_high_estimate_dollars,
        }),
      }),
      opening_bid: money({
        name: 'SaleArtworkOpeningBid',
        resolve: ({ display_opening_bid_dollars, opening_bid_cents }) => ({
          cents: opening_bid_cents,
          display: display_opening_bid_dollars,
        }),
      }),
      minimum_next_bid: money({
        name: 'SaleArtworkMinimumNextBid',
        resolve: ({ display_minimum_next_bid_dollars, minimum_next_bid_cents }) => ({
          cents: minimum_next_bid_cents,
          display: display_minimum_next_bid_dollars,
        }),
      }),
      current_bid: money({
        name: 'SaleArtworkCurrentBid',
        resolve: saleArtwork => ({
          cents: saleArtwork.highest_bid_amount_cents || saleArtwork.opening_bid_cents,
          display: (
            saleArtwork.display_highest_bid_amount_dollars ||
            saleArtwork.display_opening_bid_dollars
          ),
        }),
      }),
      highest_bid: {
        type: new GraphQLObjectType({
          name: 'SaleArtworkHighestBid',
          fields: {
            id: {
              type: GraphQLID,
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
            display: {
              type: GraphQLString,
              resolve: ({ display_amount_dollars }) => display_amount_dollars,
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
            bidder_positions: numeral(({ bidder_positions_count }) =>
              bidder_positions_count),
          },
        }),
      },
      estimate_cents: {
        type: GraphQLInt,
        description: 'Singular estimate field, if specified',
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
      bid_increments: {
        type: new GraphQLList(GraphQLInt),
        resolve: ({ minimum_next_bid_cents, sale_id }) => {
          return gravity(`sale/${sale_id}`).then((sale) => {
            return gravity('increments', {
              key: sale.increment_strategy,
            }).then((incrs) => {
              const incr = incrs[0].increments;
              const increments = [minimum_next_bid_cents];
              times(100, () => {
                const bid = last(increments);
                const bucket = find(incr, (inc) =>
                  bid >= inc.from && bid <= inc.to
                ) || last(incr);
                const nextBid = bid + bucket.amount;
                if (nextBid > BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT) return increments;
                if (!bucket.to) return increments.push(nextBid);
                const nextBidBucket = find(incr, (inc) =>
                  nextBid >= inc.from && nextBid <= inc.to
                );
                if (!nextBidBucket) return increments.push(nextBid);
                if (nextBid === nextBidBucket.from) increments.push(nextBid);
                else increments.push(bid + nextBidBucket.amount);
              });
              return increments;
            });
          });
        },
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
