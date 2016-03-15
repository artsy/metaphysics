import _ from 'lodash';
import cached from './fields/cached';
import date from './fields/date';
import gravity from '../lib/loaders/gravity';
import Artwork from './artwork';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
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
      bidder_positions_count: {
        type: GraphQLInt,
      },
      reserve_status: {
        type: GraphQLInt,
      },
      amount_cents: {
        type: GraphQLInt,
      },
      low_estimate_cents: {
        type: GraphQLInt,
      },
      high_estimate_cents: {
        type: GraphQLInt,
      },
      opening_bid_cents: {
        type: GraphQLInt,
      },
      minimum_next_bid_cents: {
        type: GraphQLInt,
      },
      currency: {
        type: GraphQLString,
      },
      symbol: {
        type: GraphQLString,
      },
      highest_bid: {
        type: new GraphQLObjectType({
          name: 'highest_bid',
          fields: {
            id: {
              type: GraphQLString,
            },
            created_at: date,
            amount_cents: {
              type: GraphQLString,
            },
          },
        }),
      },
      current_user_has_winning_bid: {
        type: GraphQLBoolean,
        resolve: (sale_artwork, $, { rootValue: { accessToken } }) => {
          if(!sale_artwork.highest_bid) return false;
          return gravity.with(accessToken)('me/bidder_positions')
            .then((positions) => {
              return _.some(_(positions).find((position) => {
                return position.highest_bid && position.highest_bid.id == sale_artwork.highest_bid.id;
              }));
            }).catch(() => false);
        }
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
          return _.compact([
            display_low_estimate_dollars,
            display_high_estimate_dollars,
          ]).join('–') || display_estimate_dollars;
        },
      },
      current_bid: {
        type: GraphQLString,
        resolve: ({ display_highest_bid_amount_dollars, display_opening_bid_dollars }) => {
          return display_highest_bid_amount_dollars || display_opening_bid_dollars;
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
