import { ResolverContext } from "types/graphql"

/**
 * Trending rankings, published daily by the `trending_searches` batch job and
 * served from Vortex's REST API. Ordered ids only — everything rendered
 * hydrates from Gravity.
 *
 * Separate from the schema types so tests can exercise it without constructing
 * GraphQL types.
 */

export interface TrendingWindow {
  period: string
  label: string
  artistIDs: string[]
  artworkIDs: string[]
}

/**
 * Display copy per window. It lives here rather than in the pipeline because
 * Vortex publishes rankings, not dropdown labels.
 */
export const TRENDING_LABELS = {
  "1d": "Today",
  "7d": "Past 7 Days",
  "30d": "Past 30 Days",
}

/**
 * The only window Vortex still publishes. Every requested period reads this
 * ranking, while `period` and `label` echo the request so older clients keep
 * distinct cache entries and their existing tab copy.
 */
export const SERVED_PERIOD = "1d"

const entityIDs = (rows: any): string[] =>
  (rows ?? []).map(({ entity_id }) => entity_id).filter(Boolean)

export const trendingWindowFor = async (
  period: string,
  context: ResolverContext
): Promise<TrendingWindow> => {
  // The unauthenticated loader so the response is cached: the ranking is the
  // same for everyone.
  const { trendingSearchesLoader } = context.unauthenticatedLoaders

  const { data } = await trendingSearchesLoader({
    period: SERVED_PERIOD,
  })

  return {
    period,
    label: TRENDING_LABELS[period],
    artistIDs: entityIDs(data?.artists),
    artworkIDs: entityIDs(data?.artworks),
  }
}
