import gravity from '../lib/loaders/gravity';
import Sale from './sale';
import SaleSorts from './sorts/sale_sorts';
import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

const Sales = {
  type: new GraphQLList(Sale.type),
  description: 'A list of Sales',
  args: {
    size: {
      type: GraphQLInt,
    },
    is_auction: {
      description: 'Limit by auction.',
      type: GraphQLBoolean,
      defaultValue: true,
    },
    published: {
      description: 'Limit by published status.',
      type: GraphQLBoolean,
      defaultValue: true,
    },
    live: {
      description: 'Limit by live status.',
      type: GraphQLBoolean,
      defaultValue: true,
    },
    sort: SaleSorts,
  },
  resolve: (root, options) =>
    gravity('sales', options),
};

export default Sales;
