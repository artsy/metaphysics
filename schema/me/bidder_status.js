import {
  get,
  find,
  first,
} from 'lodash';
import { isExisty } from '../../lib/helpers';
import gravity from '../../lib/loaders/gravity';
import BidderPosition from '../bidder_position';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';

export const highestBid = ([saleArtwork, bidderPositions]) =>
  find(bidderPositions, bidderPosition =>
    get(bidderPosition, 'highest_bid.id') === get(saleArtwork, 'highest_bid.id')
  );

export const isHighestBidder = (...args) =>
  isExisty(highestBid(...args));

const BidderStatusType = new GraphQLObjectType({
  name: 'BidderStatus',
  fields: () => ({
    is_highest_bidder: {
      type: GraphQLBoolean,
      resolve: isHighestBidder,
    },
    active_bid: {
      type: BidderPosition.type,
      description: 'Your bid if it is currently winning',
      resolve: highestBid,
    },
    most_recent_bid: {
      type: BidderPosition.type,
      description: 'Your most recent bid—which is not necessarily winning (may be higher or lower)',
      resolve: ([, bidderPositions]) => first(bidderPositions),
    },
  }),
});

export default {
  type: BidderStatusType,
  description: 'The current user\'s status relating to bids on artworks',
  args: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { sale_id, artwork_id }, { rootValue: { accessToken } }) =>
    Promise
      .all([
        gravity(`sale/${sale_id}/sale_artwork/${artwork_id}`),
        gravity.with(accessToken)('me/bidder_positions', {
          sale_id,
          artwork_id,
          sort: '-created_at',
        }),
      ])
      .then(([saleArtwork, bidderPositions]) => {
        if (bidderPositions.length === 0) return null;
        return [saleArtwork, bidderPositions];
      }),
};
