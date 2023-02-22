import * as Sentry from "@sentry/node"
import {
  MarketPriceInsight,
  MarketPriceInsightsBatchLoaderParams,
} from "lib/loaders/loaders_with_authentication/vortex"
import { isEqual, uniqWith } from "lodash"

export const enrichArtworksWithPriceInsights = async (
  artworks: Array<any>,
  marketPriceInsightsBatchLoader: (
    params: MarketPriceInsightsBatchLoaderParams
  ) => Promise<MarketPriceInsight[]>
) => {
  try {
    const marketPriceInsightParams: {
      artistId?: string
      medium?: string
      category?: string
    }[] = uniqWith(
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
          insight.medium === artwork.category
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
