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

  return {
    vortexTokenLoader,
    vortexGraphqlLoader,
    marketPriceInsightsBatchLoader: async (
      params: { artistId: string; medium: string; category: string }[]
    ) => {
      // TODO: Fix this logic once we only need category to fetch insights
      const artistIDMediumTuples = params.map((artist) => ({
        artistId: artist.artistId,
        medium: getVortexMedium(artist.medium, artist.category),
      }))

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

      return priceInsightNodes
    },
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

const VALID_VORTEX_MEDIUMS = [
  "Painting",
  "Sculpture",
  "Photography",
  "Print",
  "Drawing, Collage or other Work on Paper",
  "Mixed Media",
  "Performance Art",
  "Installation",
  "Video/Film/Animation",
  "Architecture",
  "Fashion Design and Wearable Art",
  "Jewelry",
  "Design/Decorative Art",
  "Textile Arts",
  "Posters",
  "Books and Portfolios",
  "Other",
  "Ephemera or Merchandise",
  "Reproduction",
  "NFT",
]

const getVortexMedium = (medium: string, category: string) => {
  return VALID_VORTEX_MEDIUMS.includes(medium) ? medium : category
}
