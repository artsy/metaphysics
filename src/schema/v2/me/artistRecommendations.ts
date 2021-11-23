import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { artistConnection } from "schema/v2/artist"

const MAX_ARTISTS = 50

export const ArtistRecommendations: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of artist recommendations.",
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

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

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

    const artistIds = vortexResult.data?.artistRecommendations?.edges?.map(
      (edge) => edge?.node?.artistId
    )

    let artists: any = []

    if (artistIds?.length) {
      artists = await artistsLoader({
        artist_ids: artistIds,
        size,
        offset,
      })
    }

    // TODO: get count from artists loader to optimize pagination
    const count = artists.length === 0 ? 0 : MAX_ARTISTS

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(artists, args, {
        arrayLength: count,
        sliceStart: offset ?? 0,
      }),
    }
  },
}
