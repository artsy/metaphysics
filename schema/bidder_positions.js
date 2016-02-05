import gravity from '../lib/loaders/gravity';
import BidderPosition from './bidder_position';
import {
  GraphQLList,
} from 'graphql';

const BidderPositions = {
  type: new GraphQLList(BidderPosition.type),
  description: 'A list of bidder positions',
  resolve: (root, options, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)('me/bidder_positions');
  },
};

export default BidderPositions;
