import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import ItemType from './item';
import { IDFields } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

const OrderedSetType = new GraphQLObjectType({
  name: 'OrderedSet',
  fields: () => ({
    ...IDFields,
    cached,
    key: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    item_type: {
      type: GraphQLString,
    },
    items: {
      type: new GraphQLList(ItemType),
      resolve: ({ id, item_type }) => {
        return gravity(`set/${id}/items`)
          .then(items => {
            return items.map(item => {
              item.item_type = item_type; // eslint-disable-line no-param-reassign
              return item;
            });
          });
      },
    },
  }),
});

const OrderedSets = {
  type: new GraphQLList(OrderedSetType),
  description: 'A collection of OrderedSets',
  args: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Key to the OrderedSet or group of OrderedSets',
    },
    public: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
  },
  resolve: (root, options) => gravity('sets', options),
};

export default OrderedSets;
