import { MarketPriceInsight } from "lib/loaders/loaders_with_authentication/vortex"
import { uniqWith, isEqual } from "lodash"
import * as Sentry from "@sentry/node"
export const enrichArtworksWithPriceInsights = async (
  artworks: Array<any>,
  marketPriceInsightsBatchLoader: (
    params: {
      artistId: string
      medium: string
      category: string
    }[]
  ) => Promise<MarketPriceInsight[]>
) => {
  try {
    const marketPriceInsightParams = uniqWith(
      artworks.map((artwork: any) => ({
        artistId: artwork.artist?._id,
        medium: artwork.medium,
        category: artwork.category,
      })),
      isEqual
    )

    const priceInsightNodes =
      (await marketPriceInsightsBatchLoader(marketPriceInsightParams)) || []

    return artworks.map((artwork: any) => {
      const insights = priceInsightNodes.find(
        (insight: MarketPriceInsight) =>
          insight.artistId === artwork.artist?._id &&
          // TODO: Fix this logic once we only need category to fetch insights
          (insight.medium === artwork.medium ||
            insight.medium === artwork.category)
      )

      artwork.marketPriceInsights = insights

      return artwork
    })
  } catch (error) {
    console.error("error")
    Sentry.captureException(
      "Failed to load price insights for My Collection",
      error
    )

    return artworks
  }
}
