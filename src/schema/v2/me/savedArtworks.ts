import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "../fields/pagination"
import { ArtworkType } from "../artwork"
import { pageable } from "relay-cursor-paging"
import CollectionSorts from "../sorts/collection_sorts"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice, connectionFromArray } from "graphql-relay"

const COLLECTION_ID = "saved-artwork"

export const SavedArtworksConnection = connectionWithCursorInfo({
  name: "SavedArtworks",
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

export const SavedArtworks: GraphQLFieldConfig<any, ResolverContext> = {
  type: SavedArtworksConnection.connectionType,
  args: {
    ...pageable({}),
    private: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    sort: {
      type: CollectionSorts,
    },
  },
  resolve: (_source, options, { collectionArtworksLoader }) => {
    if (!collectionArtworksLoader) return null

    const gravityOptions = Object.assign(
      { total_count: true },
      convertConnectionArgsToGravityArgs(options)
    )
    // Adds a default case for the sort
    gravityOptions.sort = gravityOptions.sort || "-position"
    // @ts-expect-error FIXME: Make `page` an optional parameter on `gravityOptions`
    delete gravityOptions.page // this can't also be used with the offset in gravity
    return collectionArtworksLoader(COLLECTION_ID, gravityOptions)
      .then(({ body, headers }) => {
        return connectionFromArraySlice(body, options, {
          arrayLength: parseInt(headers["x-total-count"] || "0", 10),
          sliceStart: gravityOptions.offset,
        })
      })
      .catch(() => {
        // For some users with no favourites, Gravity produces an error of "Collection Not Found".
        // This can cause the Gravity endpoint to produce a 404, so we will intercept the error
        // and return an empty list instead.
        return connectionFromArray([], options)
      })
  },
}
