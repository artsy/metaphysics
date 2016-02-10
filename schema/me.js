import date from './fields/date';
import gravity from '../lib/loaders/gravity';
import Profile from './profile';
import BidderPosition from './bidder_position';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import {
  uniqBy,
} from 'lodash';

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
    bidder_positions: {
      type: new GraphQLList(BidderPosition.type),
      description: "A list of the current user's bidder positions",
      args: {
        current: {
          type: GraphQLBoolean,
          description: 'Only the most recent bidder positions per artwork.',
        },
      },
      resolve: (root, { current }, { rootValue: { accessToken } }) => {
        return gravity.with(accessToken)('me/bidder_positions')
          .then((positions) => {
            return current
              ? uniqBy(positions, (p) => p.sale_artwork_id)
              : positions;
          });
      },
    },
  },
});

export default {
  type: Me,
  resolve: (root, options, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)('me');
  },
};
