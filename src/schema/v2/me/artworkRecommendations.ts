import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { getExperimentVariant, isFeatureFlagEnabled } from "lib/featureFlags"
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

// WTYL canary: route to the Gravity REST endpoint (live) instead of Vortex
// GraphQL (legacy daily-batch). Flipped per-user in the Unleash admin UI.
const GRAVITY_RAIL_FLAG = "onyx_artwork-recommendations-gravity"

// Gravity-backed rail ships in eigen 9.11.0+. Checked before the flag so older
// eigen builds (and non-eigen clients like web) never enter the rollout bucket.
const MINIMUM_EIGEN_VERSION = { major: 9, minor: 11, patch: 0 }

// Eigen refresh experiment: the front-end flag that controls the rollout split
// and unlocks experiment tracking in eigen. Only clients bucketed into the
// "variant" cohort (vs "control") get the Gravity rail, matching eigen's check
// in useEnableLiveHomeRecommendations.
const REFRESH_EIGEN_FLAG = "onyx_artwork-recommendations-refresh-eigen"

const isInRefreshExperiment = (context: ResolverContext): boolean => {
  const variant = getExperimentVariant(REFRESH_EIGEN_FLAG, {
    userId: context.userID,
  })

  return !!variant && variant.enabled && variant.name === "variant"
}

const isEligibleClient = (context: ResolverContext): boolean => {
  const actualEigenVersion = getEigenVersionNumber(context.userAgent as string)

  return (
    !!actualEigenVersion &&
    isInRefreshExperiment(context) &&
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
    // NWFY rail in artworksForUser), but WTYL hasn't wired impersonation through
    // it, so impersonated/app requests still stay on the Vortex path.
    const useGravity =
      !!artworkRecommendationsLoader &&
      !xImpersonateUserID &&
      isEligibleClient(context) &&
      isFeatureFlagEnabled(GRAVITY_RAIL_FLAG, { userId })

    // Fetching artwork IDs from the selected recommendation backend.
    const artworkIds = useGravity
      ? await getArtworkIdsFromGravity(context)
      : await getArtworkIdsFromVortex(userId, context)

    const pageArtworkIDs = artworkIds?.slice(offset, offset + size)

    // Fetching artwork details from Gravity
    const artworks = artworkIds?.length
      ? await artworksLoader({
          ids: pageArtworkIDs,
        })
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
