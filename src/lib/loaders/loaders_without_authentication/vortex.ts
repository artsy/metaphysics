import { executableVortexSchema } from "lib/stitching/vortex/schema"
import gql from "lib/gql"
import { graphql } from "graphql"
import { ResolverContext } from "types/graphql"
import { error } from "util"

const schema = executableVortexSchema({ removePricingContext: false })
const query = gql`
  query artworkPricingContextQuery(
    $artistId: String!
    $category: AnalyticsPricingContextCategoryEnum!
    $widthCm: Int!
    $heightCm: Int!
  ) {
    analyticsPricingContext(
      artistId: $artistId
      category: $category
      widthCm: $widthCm
      heightCm: $heightCm
    ) {
      bins {
        maxPriceCents
        minPriceCents
        numArtworks
      }
      filterDescription
    }
  }
`

export default () => {
  return {
    async pricingContextLoader(
      vars: {
        artistId: string
        category: string
        widthCm: number
        heightCm: number
      },
      context: ResolverContext
    ) {
      const result = await graphql(schema, query, null, context, vars)
      if (result.errors) {
        error(result.errors)
        return null
      }
      return result.data!.analyticsPricingContext
    },
  }
}
