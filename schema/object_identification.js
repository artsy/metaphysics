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

import { basename } from 'path';
import _ from 'lodash';
import {
  fromGlobalId,
  toGlobalId,
} from 'graphql-relay';
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLInterfaceType,
} from 'graphql';

/* eslint-disable no-param-reassign */
const SupportedTypes = {
  files: [
    './article',
    './artist',
    './artwork',
    './home/home_page_module',
    './partner',
    './partner_show',
  ],
};

SupportedTypes.typeMap = SupportedTypes.files.reduce((typeMap, file) => {
  const type = _.upperFirst(_.camelCase(basename(file)));
  // TODO Fix incorrect plural naming of type: https://github.com/artsy/metaphysics/issues/353
  if (type === 'HomePageModule') {
    typeMap.HomePageModules = file;
  } else {
    typeMap[type] = file;
  }
  return typeMap;
}, {});

SupportedTypes.types = _.keys(SupportedTypes.typeMap);

Object.defineProperty(SupportedTypes, 'typeModules', { get: () => {
  if (SupportedTypes._typeModules === undefined) {
    SupportedTypes._typeModules = SupportedTypes.types.reduce((modules, type) => {
      modules[type] = require(SupportedTypes.typeMap[type]).default;
      return modules;
    }, {});
  }
  return SupportedTypes._typeModules;
} });
/* eslint-enable no-param-reassign */

// Because we use a custom Node ID, we duplicate and slightly adjust the code from:
// https://github.com/graphql/graphql-relay-js/blob/master/src/node/node.js

export const NodeInterface = new GraphQLInterfaceType({
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
      .map(type => SupportedTypes.typeModules[type])
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
      const payload = type === 'HomePageModules' ? JSON.parse(id) : { id };
      // Re-uses (slightly abuses) the existing GraphQL `resolve` function.
      return SupportedTypes.typeModules[type].resolve(null, payload);
    }
  },
};

export const GlobalIDField = {
  name: '__id',
  description: 'A globally unique ID.',
  type: new GraphQLNonNull(GraphQLID),
  resolve: (obj, args, info) => toGlobalId(info.parentType.name, obj.id),
};

export const IDFields = {
  __id: GlobalIDField,
  id: {
    description: 'A type-specific ID.',
    type: new GraphQLNonNull(GraphQLString),
  },
};

export const GravityIDFields = {
  ...IDFields,
  _id: {
    description: 'A type-specific Gravity Mongo Document ID.',
    type: new GraphQLNonNull(GraphQLString),
  },
};

export default {
  GlobalIDField,
  GravityIDFields,
  IDFields,
  NodeInterface,
  NodeField,
};
