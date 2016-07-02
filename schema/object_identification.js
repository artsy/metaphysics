import gravity from '../lib/loaders/gravity';
import positron from '../lib/loaders/positron';

import {
  fromGlobalId,
  toGlobalId,
} from 'graphql-relay';
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLInterfaceType,
} from 'graphql';

// Because we use a custom Node ID, we duplicate and slightly adjust the code from:
// https://github.com/graphql/graphql-relay-js/blob/master/src/node/node.js

const NodeInterface = new GraphQLInterfaceType({
  name: 'Node',
  description: 'An object with a Globally Unique ID',
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the object.',
    },
  }),
  resolveType: (obj) => {
    if (obj.birthday !== undefined && obj.artworks_count !== undefined) {
      return require('./artist').default.type;
    } else if (obj.title !== undefined && obj.artists !== undefined) {
      return require('./artwork').default.type;
    } else if (obj.title !== undefined && obj.author !== undefined) {
      return require('./article').default.type;
    }
    return null;
  },
});

const NodeField = {
  name: 'node',
  description: 'Fetches an object given its Globally Unique ID',
  type: NodeInterface,
  args: {
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the object',
    },
  },
  resolve: (_, { __id }) => {
    const { type, id } = fromGlobalId(__id);
    switch (type) {
      case 'Artist':
        return gravity(`artist/${id}`);
      case 'Artwork':
        return gravity(`artwork/${id}`);
      case 'Article':
        return positron(`articles/${id}`);
      default:
        return null;
    }
  },
};

const GlobalIDField = {
  name: '__id',
  description: 'A Globally Unique ID',
  type: new GraphQLNonNull(GraphQLID),
  resolve: (obj, args, info) => toGlobalId(info.parentType.name, obj.id),
};

export default {
  GlobalIDField,
  NodeField,
  NodeInterface,
};
