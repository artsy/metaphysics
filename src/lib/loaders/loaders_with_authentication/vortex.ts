import config from "config"
import gql from "lib/gql"
import { extractNodes } from "lib/helpers"
import factories from "../api"

const { VORTEX_APP_ID } = config

interface LoaderArgs {
  query: string
  variables?: any
}

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

  const vortexGraphqlLoader = ({ query, variables }: LoaderArgs) =>
    vortexLoader(
      "/graphql",
      { query, variables: JSON.stringify(variables) },
      {
        method: "POST",
      }
    )

  const marketPriceInsightsBatchLoader = async (
    params: MarketPriceInsightsBatchLoaderParams
  ) => {
    const artistIDMediumTuples = params
      .map((artist) => ({
        artistId: artist.artistId,
        medium: artist.category,
      }))
      .filter((tuple) => tuple.artistId && tuple.medium)

    const vortexResult = await vortexGraphqlLoader({
      query: gql`
        query MarketPriceInsightsBatchQuery($artistIDMediumTuples: [ArtistIdMediumTupleType!]!) {
          marketPriceInsightsBatch(input: $artistIDMediumTuples, first: ${MAX_MARKET_PRICE_INSIGHTS}) {
            totalCount
            edges {
              node {
                annualLotsSold
                annualValueSoldCents
                artistId
                demandRank
                lastAuctionResultDate
                medianSalePriceLast36Months
                medium
                sellThroughRate
                medianSaleOverEstimatePercentage
                liquidityRank
              }
            }
          }
        }
      `,
      variables: { artistIDMediumTuples },
    })()

    const priceInsightNodes: MarketPriceInsight[] = extractNodes(
      vortexResult.data?.marketPriceInsightsBatch
    )

    if (vortexResult?.errors?.length) {
      console.error(vortexResult.errors)
    }

    return priceInsightNodes
  }

  return {
    vortexTokenLoader,
    vortexGraphqlLoader,
    marketPriceInsightsBatchLoader,
    auctionLotRecommendationsLoader: vortexLoader(
      "auction_lot_recommendations"
    ),
    auctionUserSegmentationLoader: vortexLoader("auction_user_segmentation"),
  }
}

const MAX_MARKET_PRICE_INSIGHTS = 50

export type MarketPriceInsight = {
  artistId: string
  medium: string
  demandRank: number
  lastAuctionResultDate: string
  annualLotsSold: number
  annualValueSold: number
}

export type MarketPriceInsightsBatchLoaderParams = {
  artistId?: string
  medium?: string
  category?: string
}[]
