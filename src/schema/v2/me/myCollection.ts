import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice, connectionFromArray } from "graphql-relay"

import { connectionWithCursorInfo } from "../fields/pagination"
import { ArtworkType } from "../artwork"

import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"

const MyCollectionConnection = connectionWithCursorInfo({
  name: "MyCollection",
  nodeType: ArtworkType,
  connectionFields: {
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
  },
})

export const MyCollection: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionConnection.connectionType,
  args: pageable({}),
  resolve: ({ id: userId }, options, { myCollectionArtworksLoader }) => {
    if (!myCollectionArtworksLoader) {
      return null
    }
    const gravityOptions = Object.assign(
      { private: true, total_count: true, user_id: userId },
      convertConnectionArgsToGravityArgs(options)
    )

    // This can't also be used with the offset in gravity
    delete gravityOptions.page

    return myCollectionArtworksLoader(gravityOptions)
      .then(({ body, headers }) => {
        return connectionFromArraySlice(body, options, {
          arrayLength: parseInt(headers["x-total-count"] || "0", 10),
          sliceStart: gravityOptions.offset,
        })
      })
      .catch((error) => {
        console.error("[schema/v2/me/my_collection] Error:", error)

        // For some users with no items, Gravity produces an error of
        // "Collection Not Found". This can cause the Gravity endpoint to
        // produce a 404, so we will intercept the error and return an empty
        // list instead.
        return connectionFromArray([], options)
      })
  },
}
