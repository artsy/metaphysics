import gravity from '../../lib/loaders/gravity';
import Bidder from '../bidder';
import {
  GraphQLList,
  GraphQLString,
} from 'graphql';

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
    const url = options.sale_id === undefined ? 'me/bidders' : 'bidders';
    if (!accessToken) return null;
    return gravity.with(accessToken)(url, options);
  },
};
