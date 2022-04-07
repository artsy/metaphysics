import gql from "lib/gql"
import { extractNodes } from "lib/helpers"

const MAX_MARKET_PRICE_INSIGHTS = 50

export const loadBatchPriceInsights = async (
  artistIDMediumTuples: any[],
  vortexGraphQLLoader: any
) => {
  try {
    const vortexResult = await vortexGraphQLLoader({
      query: gql`
        query marketPriceInsightsBatchQuery($artistIDMediumTuples: [ArtistIdMediumTupleType!]!) {
          marketPriceInsightsBatch(input: $artistIDMediumTuples, first: ${MAX_MARKET_PRICE_INSIGHTS}) {
            totalCount
            edges {
              node {
                artistId
                medium
                demandRank
              }
            }
          }
        }
      `,
      variables: { artistIDMediumTuples },
    })()

    const marketPriceInsights = {}

    extractNodes(vortexResult.data?.marketPriceInsightsBatch).forEach(
      (insight: any) => {
        marketPriceInsights[insight.artistId] = {
          ...(marketPriceInsights?.[insight.artistId] || {}),
          [insight.medium]: insight,
        }
      }
    )

    return marketPriceInsights
  } catch (e) {
    console.error(e)

    // to continue with the query in case the price insights are not available
    return {}
  }
}
