import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { ArtworkType } from "../artwork"
import { pageable } from "relay-cursor-paging"
import CollectionSorts from "../sorts/collection_sorts"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"
import { pick } from "lodash"

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
  args: pageable({
    private: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    sort: {
      type: CollectionSorts,
      defaultValue: "-position",
    },
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (_source, args, { collectionArtworksLoader }) => {
    if (!collectionArtworksLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityOptions = {
      page,
      size,
      private: args.private,
      sort: args.sort,
      total_count: true,
    }

    try {
      const { body, headers } = await collectionArtworksLoader(
        COLLECTION_ID,
        gravityOptions
      )

      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({ totalCount, offset, page, size, body, args })
    } catch {
      // For some users with no favourites, Gravity produces an error of "Collection Not Found".
      // This can cause the Gravity endpoint to produce a 404, so we will intercept the error
      // and return an empty list instead.
      return {
        totalCount: 0,
        ...connectionFromArray(
          [],
          pick(args, "before", "after", "first", "last")
        ),
      }
    }
  },
}
