import { isExisty } from '../../lib/helpers';
import gravity from '../../lib/loaders/gravity';
import BidderPosition from '../bidder_position';
import Bidder from '../bidder';
import SaleArtwork from '../sale_artwork';
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';


// is leading human bidder
export const isLeadingBidder = (lotStanding) => isExisty(lotStanding.leading_position);

export const isHighestBidder = (lotStanding) =>
  isLeadingBidder(lotStanding)
    && lotStanding.sale_artwork.reserve_status !== 'reserve_not_met';

export const LotStandingType = new GraphQLObjectType({
  name: 'LotStanding',
  fields: () => ({
    bidder: {
      type: Bidder.type,
    },
    sale_artwork: {
      type: SaleArtwork.type,
    },
    is_highest_bidder: {
      type: GraphQLBoolean,
      description: 'You are winning and reserve is met',
      resolve: isHighestBidder,
    },
    is_leading_bidder: {
      type: GraphQLBoolean,
      description: 'You are the leading bidder without regard to reserve',
      resolve: isLeadingBidder,
    },
    active_bid: {
      type: BidderPosition.type,
      description: 'Your bid if it is currently winning',
      resolve: (lotStanding) => isHighestBidder(lotStanding) ? lotStanding.leading_position : null,
    },
    most_recent_bid: {
      type: BidderPosition.type,
      description: 'Your most recent bid—which is not necessarily winning (may be higher or lower)',
      resolve: ({ max_position }) => max_position,
    },
  }),
});

export default {
  type: LotStandingType,
  description: 'The current user\'s status relating to bids on artworks',
  args: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { sale_id, artwork_id }, request, { rootValue: { accessToken } }) =>
    Promise
      .all([
        gravity.with(accessToken)('me/lot_standings', {
          sale_id,
          artwork_id,
        }),
      ])
      .then(([lotStanding]) => {
        if (lotStanding.length === 0) return null;
        return lotStanding[0];
      }),
};
