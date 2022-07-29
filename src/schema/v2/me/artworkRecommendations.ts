import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArray } from "graphql-relay"
import gql from "lib/gql"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { compact, find } from "lodash"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { artworkConnection } from "schema/v2/artwork"
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

    const { page, size } = convertConnectionArgsToGravityArgs(args)

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

    // Fetching artwork details from Gravity

    let artworks: any[] = []

    if (artworkIds?.length) {
      artworks = await artworksLoader({
        ids: artworkIds,
      })

      // Applying order from Vortex result (score ASC)

      artworks = compact(
        artworkIds.map((artworkId) => {
          return find(artworks, { _id: artworkId })
        })
      )
    }

    const count = artworks.length

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArray(artworks, args),
    }
  },
}
