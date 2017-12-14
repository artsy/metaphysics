// @ts-check
import type { GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import _ from "lodash"
import { error } from "lib/loggers"
import gravity from "lib/loaders/legacy/gravity"
import cached from "./fields/cached"
import CollectionSorts from "./sorts/collection_sorts"
import { artworkConnection } from "./artwork"
import { queriedForFieldsOtherThanBlacklisted, parseRelayOptions } from "lib/helpers"
import { GravityIDFields, NodeInterface } from "./object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean } from "graphql"

// Note to developers working on collections, the staging server does not get a copy
// of all artwork saves, so you will need to add some each week in order to have data
// to work with.

export const CollectionType = new GraphQLObjectType({
  name: "Collection",
  interfaces: [NodeInterface],
  isTypeOf: obj => _.has(obj, "name") && _.has(obj, "private") && _.has(obj, "default"),
  fields: {
    ...GravityIDFields,
    cached,
    artworks_connection: {
      type: artworkConnection,
      args: {
        ...pageable({}),
        private: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
        sort: CollectionSorts,
      },
      resolve: ({ id }, options, request, { rootValue: { accessToken, userID } }) => {
        const gravityOptions = parseRelayOptions(options)

        gravityOptions.total_count = true
        gravityOptions.user_id = userID

        delete gravityOptions.page // this can't also be used with the offset in gravity
        return gravity.with(accessToken, { headers: true })(`collection/${id}/artworks`, gravityOptions)
          .then(({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: headers["x-total-count"],
              sliceStart: gravityOptions.offset,
            })
          })
          .catch(e => {
            error("Bypassing Gravity error: ", e)
            // For some users with no favourites, Gravity produces an error of "Collection Not Found".
            // This can cause the Gravity endpoint to produce a 404, so we will intercept the error
            // and return an empty list instead.
            return connectionFromArray([], options, {
              arrayLength: 0,
              sliceStart: 0,
            })
          })
      },
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    default: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    slug: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

// This resolver is re-used by `me { saved_artworks }`
export const collectionResolver = (fieldNodes: any, accessToken: string, userID: string, id: string) => {
  const blacklistedFields = ["artworks_connection", "id", "__id"]

  if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
    return gravity.with(accessToken)(`collection/${id}`, { user_id: userID })
  }

  // These are here so that the type system's `isTypeOf`
  // resolves correctly when we're skipping gravity data
  return { id, name: null, private: null, default: null }
}

const Collection: GraphQLFieldConfig<CollectionType, *> = {
  type: CollectionType,
  args: {
    id: {
      description: "The slug or ID of the Collection",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, { fieldNodes, rootValue }) => {
    // Only make a grav call for the Collection if you need info from it
    const { accessToken, userID } = (rootValue: any)
    return collectionResolver(fieldNodes, accessToken, userID, id)
  },
}

export default Collection
