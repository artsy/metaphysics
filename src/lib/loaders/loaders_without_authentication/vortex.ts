import factories from "../api"

interface GraphQLArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory: vortexLoader } = factories(
    opts
  )

  return {
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
  }
}
