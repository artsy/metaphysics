import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { artistConnection } from "schema/v2/artist"
import { find } from "lodash"

const MAX_ARTISTS = 50

export const ArtistRecommendations: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of artist recommendations for the current user.",
  type: artistConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { vortexGraphqlLoader, artistsLoader }
  ) => {
    if (!vortexGraphqlLoader || !artistsLoader) return

    const { page, size } = convertConnectionArgsToGravityArgs(args)

    // Fetch artist IDs from Vortex

    const vortexResult = await vortexGraphqlLoader({
      query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: ${MAX_ARTISTS}) {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
    })()

    const artistIds: string[] = vortexResult.data?.artistRecommendations?.edges?.map(
      (edge) => edge?.node?.artistId
    )

    // Fetch artist details from Gravity

    let artists: any = []

    if (artistIds?.length) {
      artists = (
        await artistsLoader({
          ids: artistIds,
        })
      ).body

      // Apply order from Vortex result (score ASC)

      artists = artistIds.map((artistId) => {
        return find(artists, { _id: artistId })
      })
    }

    const count = artists.length

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArray(artists, args),
    }
  },
}
