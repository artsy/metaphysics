import gravity from '../../lib/loaders/gravity';
import Bidder from '../bidder';
import {
  GraphQLList,
} from 'graphql';

export default {
  type: new GraphQLList(Bidder.type),
  description: 'A list of the current user’s bidder registrations',
  resolve: (root, options, { rootValue: { accessToken } }) =>
    gravity.with(accessToken)('me/bidders'),
};
