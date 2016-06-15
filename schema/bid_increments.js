import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { find } from 'lodash';
import gravity from '../lib/loaders/gravity';

const BidIncrementsType = new GraphQLObjectType({
  name: 'BidIncrements',
  fields: {
    from: {
      type: GraphQLInt,
    },
    to: {
      type: GraphQLInt,
    },
    amount: {
      type: GraphQLInt,
    },
  },
});

const BidIncrements = {
  type: new GraphQLList(BidIncrementsType),
  description: 'A bid increment policy that explains minimum bids in ranges.',
  args: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The name denoting the type of bid increment policy',
    },
  },
  resolve: (root, { key }) =>
    gravity(`increments`).then((incs) => find(incs, { key }).increments),
};

export default BidIncrements;
