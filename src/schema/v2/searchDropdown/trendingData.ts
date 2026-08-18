import trendingSearches from "data/trendingSearches.json"

/**
 * Static trending data exported by hand from supernova's `trending-artists`
 * project. Ordered ids only — everything rendered hydrates from Gravity. There
 * is no pipeline behind it yet, so the data is frozen at `asOf`.
 *
 * Separate from the schema types so tests can import it without constructing
 * GraphQL types.
 */

export interface TrendingWindow {
  period: string
  label: string
  asOf: string
  artistIDs: string[]
  artworkIDs: string[]
}

export const trendingWindowFor = (period: string): TrendingWindow => {
  const window = trendingSearches.windows.find(
    (candidate) => candidate.period === period
  )

  // Unreachable through the schema; guards against the enum and the fixture
  // drifting apart.
  if (!window) {
    throw new Error(`No trending data for period: ${period}`)
  }

  return { ...window, asOf: trendingSearches.asOf }
}
