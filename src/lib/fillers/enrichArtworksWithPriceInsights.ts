import * as Sentry from "@sentry/node"
import { MarketPriceInsight } from "lib/loaders/loaders_with_authentication/vortex"
import { isEqual, uniqWith } from "lodash"
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
          insight.medium === artwork.medium
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
