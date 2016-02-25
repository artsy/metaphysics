import date from '../fields/date';
import gravity from '../../lib/loaders/gravity';
import Profile from '../profile';
import Bidders from './bidders';
import BidderPositions from './bidder_positions';
import SaleRegistrations from './sale_registrations';
import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

const Me = new GraphQLObjectType({
  name: 'Me',
  fields: {
    id: {
      type: GraphQLString,
    },
    created_at: date,
    email: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id }) =>
        gravity(`profile/${default_profile_id}`),
    },
    bidders: Bidders,
    bidder_positions: BidderPositions,
    sale_registrations: SaleRegistrations,
  },
});

export default {
  type: Me,
  resolve: (root, options, { rootValue: { accessToken } }) =>
    gravity.with(accessToken)('me'),
};
