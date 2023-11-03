import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "../fields/pagination"

export const RecentlyViewedArtworks: GraphQLFieldConfig<
  { recently_viewed_artwork_ids: string[] },
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s recently viewed artworks.",
  resolve: async (
    _me,
    args,
    { artworksLoader, recentlyViewedArtworkIdsLoader, userID }
  ) => {
    if (!userID) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    try {
      const recentlyViewedArtworksBody =
        (await recentlyViewedArtworkIdsLoader(userID))?.body || []

      const recentlyViewedIds = recentlyViewedArtworksBody
      const pageArtworkIDs = recentlyViewedIds.slice(offset, offset + size)

      const artworks = recentlyViewedIds?.length
        ? await artworksLoader({ ids: pageArtworkIDs })
        : []

      const totalCount = recentlyViewedIds.length

      const connection = connectionFromArraySlice(artworks, args, {
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
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        console.error(
          `[metaphysics @ recentlyViewedArtworks] ${formattedErr.message}]`
        )
      }
      return null
    }
  },
}
