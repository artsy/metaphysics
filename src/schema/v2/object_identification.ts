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
 * const ArtworkType = new GraphQLObjectType<any, ResolverContext>({
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
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
} from "graphql"
import { ResolverContext } from "types/graphql"

/* eslint-disable no-param-reassign */
const SupportedTypes: any = {
  files: [
    "./article",
    "./artist",
    "./artwork",
    "./artwork_version",
    "./bidder",
    "./gene",
    "./filterArtworksConnection",
    "./home/home_page_artwork_module",
    "./home/home_page_artist_module",
    "./me",
    "./me/conversation",
    "./me/conversation/invoice",
    "./partner/partner",
    "./show",
    "./fair",
    "./sale",
    "./collection",
    "./sale_artwork",
    "./user",
  ],
}

const typeNames = {
  "./filterArtworksConnection": "filterArtworksConnection",
}

const exportNames = {
  filterArtworksConnection: "filterArtworksConnection",
}

SupportedTypes.typeMap = SupportedTypes.files.reduce((typeMap, file) => {
  const type = typeNames[file] || _.upperFirst(_.camelCase(basename(file)))
  typeMap[type] = file
  return typeMap
}, {})

SupportedTypes.types = _.keys(SupportedTypes.typeMap)

Object.defineProperty(SupportedTypes, "typeModules", {
  get: () => {
    if (SupportedTypes._typeModules === undefined) {
      SupportedTypes._typeModules = SupportedTypes.types.reduce(
        (modules, type) => {
          const exportType = exportNames[type] || "default"
          modules[type] = require(SupportedTypes.typeMap[type])[exportType]
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
  const isFilterType =
    type === "FilterArtworks" || type === "filterArtworksConnection"
  return isFilterType || type.startsWith("HomePage") ? JSON.parse(id) : { id }
}

function rootValueForChild(rootValue) {
  const selections = rootValue.fieldNodes[0].selectionSet.selections
  let fragment = _.find(selections, (selection) => {
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
  fields: () => {
    const { resolve, ...id } = GlobalIDField
    return {
      id,
    }
  },
  resolveType: ({ __type }) => __type,
})

const NodeField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "Fetches an object given its globally unique ID.",
  type: NodeInterface,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The globally unique ID of the node.",
    },
  },
  // Re-uses (slightly abuses) the existing GraphQL `resolve` function.
  resolve: (_root, { id: globalID }, context, rootValue) => {
    const { type: typeName, id } = fromGlobalId(globalID)
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
          context,
          rootValueForChild(rootValue)
        )
      ).then((data) => {
        // Add the already known type so `NodeInterface` can pluck that out in
        // its `resolveType` implementation.
        return { __type: type, ...data }
      })
    }
  },
}

export const GlobalIDField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "A globally unique ID.",
  type: new GraphQLNonNull(GraphQLID),
  // Ensure we never encode a null `id`, as it would silently work. Instead
  // return `null`, so that graphql-js will complain about the result not
  // matching the type specified in the schema.
  resolve: (obj, _args, _request, info) => {
    return (
      (obj._id && toGlobalId(info.parentType.name, obj._id)) ||
      (obj.id && toGlobalId(info.parentType.name, obj.id))
    )
  },
}

export const NullableIDField: GraphQLFieldConfigMap<any, ResolverContext> = {
  internalID: {
    description: "An optional type-specific ID.",
    type: GraphQLID,
    resolve: ({ id }) => id,
  },
}

export const IDFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  id: GlobalIDField,
  internalID: {
    description: "A type-specific ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ id }) => id,
  },
}

export const GravityIDFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  ...IDFields,
  internalID: {
    description: "A type-specific Gravity Mongo Document ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ _id }) => _id,
  },
}

export const SlugIDField: GraphQLFieldConfigMap<any, ResolverContext> = {
  slug: {
    description: "A slug ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ id }) => id,
  },
}

export const SlugAndInternalIDFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  id: GlobalIDField,
  slug: {
    description: "A slug ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ id }) => id,
  },
  internalID: {
    description: "A type-specific ID likely used as a database ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ _id }) => _id,
  },
}

export const InternalIDFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  id: GlobalIDField,
  internalID: {
    description: "A type-specific ID likely used as a database ID.",
    type: new GraphQLNonNull(GraphQLID),
    resolve: ({ id }) => id,
  },
}

export default {
  GlobalIDField,
  GravityIDFields,
  IDFields,
  NodeInterface,
  NodeField,
}
