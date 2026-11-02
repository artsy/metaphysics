import config from "config"
import factories from "../api"
import { createMarketPriceInsightsBatchLoader } from "../vortexMarketPriceInsightsBatchLoader"
import {
  createPartnerStatsLoader,
  PartnerStatsSection,
} from "../vortexPartnerStatsLoader"

const { VORTEX_APP_ID } = config

export default (accessToken, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const {
    gravityLoaderWithAuthenticationFactory,
    vortexLoaderWithAuthenticationFactory,
  } = factories(opts)

  const vortexAccessTokenLoader = () =>
    vortexTokenLoader().then((data) => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  const vortexLoader = vortexLoaderWithAuthenticationFactory(
    vortexAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const vortexTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: VORTEX_APP_ID },
    { method: "POST" }
  )

  return {
    vortexTokenLoader,
    marketPriceInsightsBatchLoader: createMarketPriceInsightsBatchLoader(
      vortexLoader("market_price_insights_batch", {}, { method: "POST" })
    ),
    auctionLotRecommendationsLoader: vortexLoader(
      "auction_lot_recommendations"
    ),
    auctionUserSegmentationLoader: vortexLoader("auction_user_segmentation"),
    userPricePreferenceLoader: vortexLoader("user_price_preference"),
    artworkCaptionsLoader: vortexLoader(
      "artwork_captions",
      {},
      { requestThrottleMs: 86400000 } // 1 day throttle
    ),
    similarGalleriesInteractionsLoader: vortexLoader(
      "similar_galleries_interactions"
    ),
    vortexArtistRecommendationsLoader: vortexLoader("artist_recommendations"),
    vortexArtworkRecommendationsLoader: vortexLoader("artwork_recommendations"),
    vortexNewForYouRecommendationsLoader: vortexLoader(
      "new_for_you_recommendations"
    ),
    vortexUserArtistAffinitiesLoader: vortexLoader(
      "user_artist_affinities",
      {},
      { method: "POST" }
    ),
    // Per partner, and Vortex authorizes them with the user's token, so the
    // authenticated factory (no memcache) is the right one.
    vortexPartnerStatsLoader: createPartnerStatsLoader(
      vortexLoader<any, PartnerStatsSection>(
        (section) => `partner_stats/${section}`
      )
    ),
    vortexUserStatsLoader: vortexLoader("user_stats"),
  }
}

// Vortex's BigInt fields arrive as strings.
export type MarketPriceInsight = {
  annualLotsSold: number | null
  annualValueSoldCents: string | null
  artistId: string
  demandRank: number | null
  lastAuctionResultDate: string | null
  medianSalePriceLast36Months: string | null
  medium: string
  sellThroughRate: number | null
  medianSaleOverEstimatePercentage: number | null
  liquidityRank: number | null
}

export type MarketPriceInsightsBatchLoaderParams = {
  artistId?: string
  medium?: string
  category?: string
}[]
