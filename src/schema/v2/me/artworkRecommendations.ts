import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import gql from "lib/gql"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

// This limits the maximum number of artworks we receive from Vortex and is related to how we implement the Connection in this resolver.
const MAX_ARTWORKS = 50

export const ArtworkRecommendations: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of artwork recommendations for the current user.",
  type: artworkConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { vortexGraphqlLoader, artworksLoader }
  ) => {
    if (!vortexGraphqlLoader || !artworksLoader) return

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Fetching artwork IDs from Vortex

    const vortexResult = await vortexGraphqlLoader({
      query: gql`
        query artworkRecommendationsQuery {
          artworkRecommendations(first: ${MAX_ARTWORKS}) {
            totalCount
            edges {
              node {
                artworkId
                score
              }
            }
          }
        }
      `,
    })()

    const artworkRecommendations = extractNodes(
      vortexResult.data?.artworkRecommendations
    )
    const artworkIds = artworkRecommendations.map(
      (node: any) => node?.artworkId
    )

    const pageArtworkIDs = artworkIds?.slice(offset, offset + size)

    // Fetching artwork details from Gravity

    const artworks = artworkIds?.length
      ? await artworksLoader({
          ids: pageArtworkIDs,
        })
      : []

    const totalCount = artworkRecommendations.length

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
  },
}
