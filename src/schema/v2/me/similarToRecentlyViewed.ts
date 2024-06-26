import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "../fields/pagination"
import { formatGravityError } from "lib/gravityErrorHandler"

const MAX_ARTWORKS = 50

export const SimilarToRecentlyViewed: GraphQLFieldConfig<
  { recently_viewed_artwork_ids: string[] },
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({}),
  description: "A list of artworks similar to recently viewed artworks.",
  resolve: async (
    { recently_viewed_artwork_ids },
    args,
    {
      similarArtworksLoader,
      recentlyViewedArtworkIdsLoader,
      userID,
      xImpersonateUserID,
    }
  ) => {
    if (!userID && !xImpersonateUserID) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Fetching all artworks until the current page because `offset` isn't working for similarArtworksLoader
    const numberOfArtworksToFetch = Math.min(size + offset, MAX_ARTWORKS)

    try {
      let artworkIDs

      // If `recently_viewed_artwork_ids` exists, use those
      if (recently_viewed_artwork_ids) {
        artworkIDs = recently_viewed_artwork_ids
      } else if (xImpersonateUserID) {
        // Otherwise, we are impersonating and use special loader to fetch
        const {
          body: recentlyViewedArtworkIds,
        } = await recentlyViewedArtworkIdsLoader(xImpersonateUserID)
        artworkIDs = recentlyViewedArtworkIds
      }

      const artworks =
        artworkIDs?.length > 0
          ? await similarArtworksLoader({
              artwork_id: artworkIDs,
              for_sale: true,
              size: numberOfArtworksToFetch,
            })
          : []

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
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        console.error(
          `[metaphysics @ similarToRecentlyViewed] ${formattedErr.message}]`
        )
      }
      return null
    }
  },
}
