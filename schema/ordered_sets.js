import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import ItemType from './item';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList
} from 'graphql';

let OrderedSetType = new GraphQLObjectType({
  name: 'OrderedSet',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    key: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    item_type: {
      type: GraphQLString
    },
    items: {
      type: new GraphQLList(ItemType),
      resolve: ({ id, item_type }) => {
        return gravity(`set/${id}/items`)
          .then(items => {
            return items.map(item => {
              item.item_type = item_type;
              return item;
            });
          });
      }
    }
  })
});

let OrderedSets = {
  type: new GraphQLList(OrderedSetType),
  description: 'A collection of OrderedSets',
  args: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Key to the OrderedSet or group of OrderedSets'
    }
  },
  resolve: (root, options) => gravity('sets', _.defaults(options, {
    public: true
  }))
};

export default OrderedSets;
