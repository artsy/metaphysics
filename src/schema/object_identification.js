/**
 * To support a type, it should:
 *
 * - specify that it implements the Node interface
 * - add the Node `__id` fields
 * - add to the below `SupportedTypes` list.
 *
 * @example
 *
 * import { has } from 'lodash';
 *
 * import {
 *   GlobalIDField,
 *   NodeInterface,
 * } from './object_identification';
 *
 * const ArtworkType = new GraphQLObjectType({
 *   ...
 *   interfaces: [NodeInterface],
 *   fields: () => ({
 *     __id: GlobalIDField,
 *     ...
 *   }),
 * });
 */

import { basename } from "path"
import _ from "lodash"
import { fromGlobalId, toGlobalId } from "graphql-relay"
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLInterfaceType,
} from "graphql"

/* eslint-disable no-param-reassign */
const SupportedTypes = {
  files: [
    "./article",
    "./artist",
    "./artwork",
    "./gene",
    "./filter_artworks",
    "./home/home_page_artwork_module",
    "./home/home_page_artist_module",
    "./me",
    "./me/conversation",
    "./me/conversation/invoice",
    "./partner",
    "./partner_show",
    "./show",
    "./sale",
    "./collection",
  ],
}

SupportedTypes.typeMap = SupportedTypes.files.reduce((typeMap, file) => {
  const type = _.upperFirst(_.camelCase(basename(file)))
  typeMap[type] = file
  return typeMap
}, {})

SupportedTypes.types = _.keys(SupportedTypes.typeMap)

Object.defineProperty(SupportedTypes, "typeModules", {
  get: () => {
    if (SupportedTypes._typeModules === undefined) {
      SupportedTypes._typeModules = SupportedTypes.types.reduce(
        (modules, type) => {
          modules[type] = require(SupportedTypes.typeMap[type]).default
          return modules
        },
        {}
      )
    }
    return SupportedTypes._typeModules
  },
})
/* eslint-enable no-param-reassign */

const isSupportedType = _.includes.bind(null, SupportedTypes.types)

function argumentsForChild(type, id) {
  return type === "FilterArtworks" || type.startsWith("HomePage")
    ? JSON.parse(id)
    : { id }
}

function rootValueForChild(rootValue) {
  const selections = rootValue.fieldNodes[0].selectionSet.selections
  let fragment = _.find(selections, selection => {
    return (
      selection.kind === "InlineFragment" || selection.kind === "FragmentSpread"
    )
  })
  if (fragment && fragment.kind === "FragmentSpread") {
    fragment = rootValue.fragments[fragment.name.value]
  }
  return _.assign({}, rootValue, { fieldNodes: fragment && [fragment] })
}

// Because we use a custom Node ID, we duplicate and slightly adjust the code from:
// https://github.com/graphql/graphql-relay-js/blob/master/src/node/node.js

export const NodeInterface = new GraphQLInterfaceType({
  name: "Node",
  description: "An object with a Globally Unique ID",
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object.",
    },
  }),
  resolveType: ({ __type }) => __type,
})

const NodeField = {
  name: "node",
  description: "Fetches an object given its Globally Unique ID",
  type: NodeInterface,
  args: {
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object",
    },
  },
  // Re-uses (slightly abuses) the existing GraphQL `resolve` function.
  resolve: (root, { __id }, request, rootValue) => {
    const { type: typeName, id } = fromGlobalId(__id)
    if (isSupportedType(typeName)) {
      let exported = SupportedTypes.typeModules[typeName]
      if (typeof exported === "function") {
        exported = exported()
      }
      const { resolve, type } = exported
      return Promise.resolve(
        resolve(
          null,
          argumentsForChild(typeName, id),
          request,
          rootValueForChild(rootValue)
        )
      ).then(data => {
        // Add the already known type so `NodeInterface` can pluck that out in
        // its `resolveType` implementation.
        return { __type: type, ...data }
      })
    }
  },
}

export const GlobalIDField = {
  name: "__id",
  description: "A globally unique ID.",
  type: new GraphQLNonNull(GraphQLID),
  // Ensure we never encode a null `id`, as it would silently work. Instead return `null`, so that
  // e.g. Relay will complain about the result not matching the type specified in the schema.
  resolve: (obj, args, request, info) =>
    obj.id && toGlobalId(info.parentType.name, obj.id),
}

export const IDFields = {
  __id: GlobalIDField,
  id: {
    description: "A type-specific ID.",
    type: new GraphQLNonNull(GraphQLString),
  },
}

export const GravityIDFields = {
  ...IDFields,
  _id: {
    description: "A type-specific Gravity Mongo Document ID.",
    type: new GraphQLNonNull(GraphQLString),
  },
}

export default {
  GlobalIDField,
  GravityIDFields,
  IDFields,
  NodeInterface,
  NodeField,
}
