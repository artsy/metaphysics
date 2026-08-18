import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import gql from "lib/gql"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

// This limits the maximum number of artworks we receive from the recommendation
// backend and is related to how we implement the Connection in this resolver.
const MAX_ARTWORKS = 50

// WTYL: the Gravity-backed rail (the winning variant, now the default) ships in
// eigen 9.11.0+, so older eigen builds and non-eigen clients (like web) stay on
// the Vortex path.
const MINIMUM_EIGEN_VERSION = { major: 9, minor: 11, patch: 0 }

const isEligibleClient = (context: ResolverContext): boolean => {
  const actualEigenVersion = getEigenVersionNumber(context.userAgent as string)

  return (
    !!actualEigenVersion &&
    isAtLeastVersion(actualEigenVersion, MINIMUM_EIGEN_VERSION)
  )
}

const getArtworkIdsFromVortex = async (
  userId: string | undefined,
  context: ResolverContext
): Promise<string[]> => {
  const {
    authenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
    },
    unauthenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
    },
    xImpersonateUserID,
  } = context

  const query = {
    query: gql`
        query artworkRecommendationsQuery {
          artworkRecommendations(first: ${MAX_ARTWORKS}, userId: "${userId}") {
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
  }

  const vortexResult = xImpersonateUserID
    ? await vortexGraphQLUnauthenticatedLoader!(query)()
    : await vortexGraphQLAuthenticatedLoader!(query)()

  return extractNodes(vortexResult.data?.artworkRecommendations).map(
    (node: any) => node?.artworkId
  )
}

const getArtworkIdsFromGravity = async (
  context: ResolverContext
): Promise<string[]> => {
  const { artworkRecommendationsLoader } = context

  try {
    const { artwork_ids } = await artworkRecommendationsLoader!({
      size: MAX_ARTWORKS,
    })

    return artwork_ids ?? []
  } catch (err) {
    if (err.statusCode === 404) {
      return []
    }
    throw err
  }
}

export const ArtworkRecommendations: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of artwork recommendations for the current user.",
  type: artworkConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    const {
      artworksLoader,
      artworkRecommendationsLoader,
      authenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
      },
      xImpersonateUserID,
      userID,
    } = context

    if (!artworksLoader || !vortexGraphQLAuthenticatedLoader) return

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const userId = userID || xImpersonateUserID

    // The Gravity endpoint accepts a `user_id` param for trusted apps (see the
    // NWFY rail in artworksForUser), but impersonation isn't wired through it,
    // so impersonated/app requests still stay on the Vortex path.
    const useGravity =
      !!artworkRecommendationsLoader &&
      !xImpersonateUserID &&
      isEligibleClient(context)

    // Fetching artwork IDs from the selected recommendation backend.
    const artworkIds = useGravity
      ? await getArtworkIdsFromGravity(context)
      : await getArtworkIdsFromVortex(userId, context)

    const pageArtworkIDs = artworkIds.slice(offset, offset + size)

    // Fetching artwork details from Gravity
    const artworks = pageArtworkIDs.length
      ? await artworksLoader({ ids: pageArtworkIDs })
      : []

    const totalCount = artworkIds.length

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
