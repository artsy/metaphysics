import DataLoader from "dataloader"
import { compact, uniqBy } from "lodash"
import type {
  MarketPriceInsight,
  MarketPriceInsightsBatchLoaderParams,
} from "./loaders_with_authentication/vortex"

// Vortex rejects larger batches.
const MAX_TUPLES_PER_REQUEST = 100

type MarketPriceInsightsBatchRESTLoader = (params: {
  tuples: { artist_id: string; medium: string }[]
}) => Promise<{ data?: Record<string, any>[] }>

interface Market {
  artistId: string
  medium: string
}

// Vortex matches mediums case-insensitively.
const marketKey = (artistId: string, medium: string) =>
  JSON.stringify([artistId, medium.toLowerCase()])

/**
 * The node shape the stitched `marketPriceInsightsBatch` query returned, which
 * `ArtworkPriceInsights` resolves from: camelCase, with Vortex's BigInt fields
 * as strings.
 */
const toMarketPriceInsight = (
  insight: Record<string, any>
): MarketPriceInsight => ({
  annualLotsSold: insight.annual_lots_sold,
  annualValueSoldCents: insight.annual_value_sold_cents?.toString() ?? null,
  artistId: insight.artist_id,
  demandRank: insight.demand_rank,
  lastAuctionResultDate: insight.last_auction_result_date,
  medianSalePriceLast36Months:
    insight.median_sale_price_last_36_months?.toString() ?? null,
  medium: insight.medium,
  sellThroughRate: insight.sell_through_rate,
  medianSaleOverEstimatePercentage:
    insight.median_sale_over_estimate_percentage,
  liquidityRank: insight.liquidity_rank,
})

/**
 * Loads market price insights for (artist, medium) pairs, merging every pair
 * asked for in the same tick into as few Vortex requests as possible. Lists of
 * artworks resolving `hasMarketPriceInsights` make one request rather than one
 * per artwork.
 *
 * Takes and returns what the stitched batch loader did: `category` is the
 * medium, pairs missing either are skipped, and only found insights are
 * returned. Create one per request: results are cached for its lifetime.
 */
export const createMarketPriceInsightsBatchLoader = (
  restLoader: MarketPriceInsightsBatchRESTLoader
) => {
  const loader = new DataLoader<Market, MarketPriceInsight | null>(
    async (markets) => {
      const { data } = await restLoader({
        tuples: markets.map(({ artistId, medium }) => ({
          artist_id: artistId,
          medium,
        })),
      })

      const insightsByMarket = new Map(
        (data ?? []).map((insight) => [
          marketKey(insight.artist_id, insight.medium),
          toMarketPriceInsight(insight),
        ])
      )

      return markets.map(
        ({ artistId, medium }) =>
          insightsByMarket.get(marketKey(artistId, medium)) ?? null
      )
    },
    {
      cacheKeyFn: ({ artistId, medium }) => marketKey(artistId, medium),
      maxBatchSize: MAX_TUPLES_PER_REQUEST,
    }
  )

  return async (
    params: MarketPriceInsightsBatchLoaderParams
  ): Promise<MarketPriceInsight[]> => {
    const markets = uniqBy(
      params.flatMap(({ artistId, category }) =>
        artistId && category ? [{ artistId, medium: category }] : []
      ),
      ({ artistId, medium }) => marketKey(artistId, medium)
    )

    const insights = await loader.loadMany(markets)
    const error = insights.find((insight) => insight instanceof Error)
    if (error) throw error

    return compact(insights as (MarketPriceInsight | null)[])
  }
}
