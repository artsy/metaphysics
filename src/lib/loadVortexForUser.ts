import { isNil, omitBy } from "lodash"
import { ResolverContext } from "types/graphql"

type UserScopedVortexLoaderName =
  | "vortexArtistRecommendationsLoader"
  | "vortexArtworkRecommendationsLoader"
  | "vortexNewForYouRecommendationsLoader"
  | "vortexUserArtistAffinitiesLoader"

/**
 * Loads a user's data (recommendations, affinities) from Vortex's REST API,
 * replacing the GraphQL queries made through `vortexGraphqlLoader` once
 * `USE_UNSTITCHED_VORTEX` is on.
 *
 * Impersonated requests (e.g. Braze) go through the unauthenticated loader so
 * Vortex honours `user_id`; otherwise Vortex uses the logged-in user and
 * ignores it.
 */
export const loadVortexForUser = async <T = any>(
  context: ResolverContext,
  loaderName: UserScopedVortexLoaderName,
  params: Record<string, unknown>
): Promise<T[]> => {
  const loader = context.xImpersonateUserID
    ? context.unauthenticatedLoaders[loaderName]
    : context.authenticatedLoaders[loaderName]

  if (!loader) {
    throw new Error("Authentication failed: User is not authenticated.")
  }

  const { data } = await loader(omitBy(params, isNil))
  return data ?? []
}
