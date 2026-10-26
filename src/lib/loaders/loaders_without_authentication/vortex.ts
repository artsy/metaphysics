import factories from "../api"
import {
  createPartnerStatsLoader,
  PartnerStatsSection,
} from "../vortexPartnerStatsLoader"

interface GraphQLArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory: vortexLoader } = factories(
    opts
  )

  // Warehouse data is the same for every user and reloaded once a day, at a
  // time the cache isn't aligned with. A day-long throttle could serve the
  // previous load for most of a day; an hour bounds that, matching Vortex's
  // own `expires_in`.
  const warehouseLoader = (path: string) =>
    vortexLoader(path, {}, { requestThrottleMs: 3600000 }) // 1 hour throttle

  return {
    artistSparklinesLoader: warehouseLoader("artist_sparklines"),
    calendarYearMarketPriceInsightsLoader: warehouseLoader(
      "calendar_year_market_price_insights"
    ),
    calendarYearPriceInsightsLoader: warehouseLoader(
      "calendar_year_price_insights"
    ),
    marketPriceInsightsLoader: warehouseLoader("market_price_insights"),
    priceInsightsLoader: warehouseLoader("price_insights"),
    pricingContextLoader: warehouseLoader("pricing_context"),
    warehouseMetadataLoader: warehouseLoader("warehouse_metadata"),
    vortexGraphqlLoader: ({ query, variables }: GraphQLArgs) => {
      return vortexLoader(
        "/graphql",
        { query, variables: JSON.stringify(variables) },
        {
          method: "POST",
        }
      )
    },
    auctionLotRecommendationsLoader: vortexLoader(
      "auction_lot_recommendations"
    ),
    artworkCaptionsLoader: vortexLoader(
      "artwork_captions",
      {},
      { requestThrottleMs: 86400000 } // 1 day throttle
    ),
    trendingSearchesLoader: vortexLoader(
      "trending_searches",
      {},
      { requestThrottleMs: 3600000 } // 1 hour throttle
    ),
    // Per-user data for impersonated requests (e.g. Braze), so never shared
    // through the cache.
    vortexArtistRecommendationsLoader: vortexLoader(
      "artist_recommendations",
      {},
      { skipCache: true }
    ),
    vortexArtworkRecommendationsLoader: vortexLoader(
      "artwork_recommendations",
      {},
      { skipCache: true }
    ),
    vortexNewForYouRecommendationsLoader: vortexLoader(
      "new_for_you_recommendations",
      {},
      { skipCache: true }
    ),
    vortexUserArtistAffinitiesLoader: vortexLoader(
      "user_artist_affinities",
      {},
      { method: "POST" }
    ),
    // Partner and user stats for requests without a user (e.g. an email
    // provider's app token). Per partner/user and authorized by the token, so
    // never shared through the cache.
    vortexPartnerStatsLoader: createPartnerStatsLoader(
      vortexLoader<any, PartnerStatsSection>(
        (section) => `partner_stats/${section}`,
        {},
        { skipCache: true }
      )
    ),
    vortexUserStatsLoader: vortexLoader("user_stats", {}, { skipCache: true }),
  }
}
