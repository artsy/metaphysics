import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { artistConnection } from "schema/v2/artist"

// This limits the maximum number of artists we receive from Vortex and is related to how we implement the Connection in this resolver.
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
    {
      artistsLoader,
      authenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
      },
      xImpersonateUserID,
      userID,
    }
  ) => {
    if (!artistsLoader) return

    const { page, size } = convertConnectionArgsToGravityArgs(args)

    const userId = userID || xImpersonateUserID

    // Fetch artist IDs from Vortex
    const query = {
      query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: ${MAX_ARTISTS}, userId: "${userId}") {
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
    }

    const isAuthenticatedRequest = !!vortexGraphQLAuthenticatedLoader

    const vortexResult = isAuthenticatedRequest
      ? await vortexGraphQLAuthenticatedLoader(query)()
      : await vortexGraphQLUnauthenticatedLoader(query)()

    const artistIds = extractNodes(
      vortexResult.data?.artistRecommendations
    ).map((node: any) => node?.artistId)

    // Fetch artist details from Gravity
    const artists = artistIds?.length
      ? (
          await artistsLoader({
            ids: artistIds,
          })
        ).body
      : []

    const count = artists.length

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArray(artists, args),
    }
  },
}
