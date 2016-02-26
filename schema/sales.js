import gravity from '../lib/loaders/gravity';
import Sale from './sale';
import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLEnumType,
} from 'graphql';

export const Sorts = {
  type: new GraphQLEnumType({
    name: 'SaleSorts',
    values: {
      _ID_ASC: {
        value: '_id',
      },
      _ID_DESC: {
        value: '-_id',
      },
      NAME_ASC: {
        value: 'name',
      },
      NAME_DESC: {
        value: '-name',
      },
      CREATED_AT_ASC: {
        value: 'created_at',
      },
      CREATED_AT_DESC: {
        value: '-created_at',
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_ASC: {
        value: 'eligible_sale_artworks_count',
      },
      ELIGIBLE_SALE_ARTWORKS_COUNT_DESC: {
        value: '-eligible_sale_artworks_count',
      },
    },
  }),
};

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
    sort: Sorts,
  },
  resolve: (root, options) =>
    gravity('sales', options),
};

export default Sales;
