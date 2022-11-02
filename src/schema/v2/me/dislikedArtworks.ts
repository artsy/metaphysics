import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { ArtworkType } from "../artwork"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import CollectionSorts from "../sorts/collection_sorts"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"

const COLLECTION_ID = "disliked-artwork"

export const DislikedArtworksConnection = connectionWithCursorInfo({
  name: "DislikedArtworks",
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

export const DislikedArtworks: GraphQLFieldConfig<any, ResolverContext> = {
  type: DislikedArtworksConnection.connectionType,
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
    } catch (error) {
      return CatchCollectionNotFoundException(error)
    }
  },
}
