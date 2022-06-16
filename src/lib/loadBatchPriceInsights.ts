import gql from "lib/gql"
import { extractNodes } from "lib/helpers"
import { StaticPathLoader } from "./loaders/api/loader_interface"

const MAX_MARKET_PRICE_INSIGHTS = 50

type MarketPriceInsight = {
  artistId: string
  medium: string
  demandRank: number
  lastAuctionResultDate: string
  annualLotsSold: number
  annualValueSold: number
}

export const loadBatchPriceInsights = async (
  artistIDMediumTuples: { artistId: string; medium: string }[],
  vortexGraphQLLoader: ({ query, variables }) => StaticPathLoader<any>
) => {
  try {
    const vortexResult = await vortexGraphQLLoader({
      query: gql`
        query MarketPriceInsightsBatchQuery($artistIDMediumTuples: [ArtistIdMediumTupleType!]!) {
          marketPriceInsightsBatch(input: $artistIDMediumTuples, first: ${MAX_MARKET_PRICE_INSIGHTS}) {
            totalCount
            edges {
              node {
                artistId
                medium
                demandRank
                annualLotsSold
                annualValueSoldCents
                lastAuctionResultDate
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

    const marketPriceInsights: Record<
      string,
      Record<string, MarketPriceInsight>
    > = priceInsightNodes.reduce((result: any, insight) => {
      result[insight.artistId] = {
        ...(result?.[insight.artistId] || {}),
        [insight.medium]: insight,
      }

      return result
    }, {})

    return marketPriceInsights
  } catch (e) {
    console.error(e)

    // to continue with the query in case the price insights are not available
    return {}
  }
}
