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
  }
}
