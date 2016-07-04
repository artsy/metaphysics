// To support a type, it should:
// * specify that it implements the Node interface
// * add the Node `__id` fields
// * implement a `isType` function that from a payload determines if the payload is of that type
// * add to the below `SupportedTypes` list.
//
// Example:
//
//   import ObjectIdentification from './object_identification';
//
//   const ArtworkType = new GraphQLObjectType({
//     ...
//     interfaces: [ObjectIdentification.NodeInterface],
//     fields: () => {
//       return {
//         __id: ObjectIdentification.GlobalIDField,
//         ...
//       };
//     },
//   });
//
//   const Artwork = {
//     type: ArtworkType,
//     resolve: (root, { id }) => gravity(`artwork/${id}`),
//     isType: (obj) => obj.title !== undefined && obj.artists !== undefined,
//     ...
//   };

import _ from 'lodash';
import {
  fromGlobalId,
  toGlobalId,
} from 'graphql-relay';
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLInterfaceType,
} from 'graphql';

const SupportedTypes = {
  types: ['Article', 'Artist', 'Artwork', 'Partner', 'PartnerShow'],
  // To prevent circular dependencies, when this file is loaded, the modules are lazily loaded.
  typeModule: _.memoize(type => require(`./${_.snakeCase(type)}`).default),
};

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
    const mod = _.chain(SupportedTypes.types)
      .map(type => SupportedTypes.typeModule(type))
      .find(m => m.isType(obj))
      .value();
    return mod && mod.type;
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
  resolve: (root, { __id }) => {
    const { type, id } = fromGlobalId(__id);
    if (_.includes(SupportedTypes.types, type)) {
      // Re-uses (slightly abuses) the existing GraphQL `resolve` function.
      return SupportedTypes.typeModule(type).resolve(null, { id });
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
