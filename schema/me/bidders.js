/* @flow */

import {
  GraphQLList,
  GraphQLString,
} from 'graphql';

import gravity from '../../lib/loaders/gravity';
import Bidder from '../bidder';

export default {
  type: new GraphQLList(Bidder.type),
  description: 'A list of the current user’s bidder registrations',
  args: {
    sale_id: {
      type: GraphQLString,
      description: 'The slug or ID of a Sale',
    },
  },
  resolve: (root, options, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken)('me/bidders', options);
  },
};
