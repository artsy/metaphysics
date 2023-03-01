import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "../fields/pagination"

export const SimilarToRecentlyViewed: GraphQLFieldConfig<
  { recently_viewed_artwork_ids: string[] },
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s recently viewed artworks.",
  resolve: async (
    { recently_viewed_artwork_ids },
    args,
    { similarArtworksLoader }
  ) => {
    const recentlyViewedIds = recently_viewed_artwork_ids.slice(0, 7)

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const artworks = await similarArtworksLoader({
      artwork_id: recentlyViewedIds,
      for_sale: true,
      size: 50,
    })

    const totalCount = artworks.length

    const pageArtworks = artworks.slice(offset, offset + size)

    const connection = connectionFromArraySlice(pageArtworks, args, {
      arrayLength: totalCount,
      sliceStart: offset,
    })

    const totalPages = Math.ceil(totalCount / size)

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connection,
      pageInfo: {
        ...connection.pageInfo,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    }
  },
}
