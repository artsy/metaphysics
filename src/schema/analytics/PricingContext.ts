import { GraphQLFieldConfig, graphql } from "graphql"
import { PricingContextType } from "./PricingContextType"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { error } from "util"

export const PricingContext: GraphQLFieldConfig<any, ResolverContext> = {
  type: PricingContextType,
  resolve: async (
    { width_cm, height_cm, artist, category, price_cents: [listPriceCents] },
    _,
    context
  ) => {
    // fail if we don't have enough info to request a histogram
    if (!artist || !width_cm || !height_cm || !category || !listPriceCents) {
      return null
    }
    // this feature is only enbaled for lab users right now
    if (!context.authenticatedLoaders.meLoader) {
      return null
    }
    const me = await context.authenticatedLoaders.meLoader()
    if (!me.lab_features || !me.lab_features.includes("Pricing Context")) {
      return null
    }

    // copying vortex to calculate the 'dimensions' field which is actually an enum of "small" | "medium" | "large"
    // https://github.com/artsy/vortex/blob/f9427ab1a182d2249c13d0ff246a378fb0c9eef0/dbt/models/sales/price_records.sql#L8
    const area = width_cm * height_cm
    const dimensions =
      area < 40 * 40 ? "SMALL" : area < 70 * 70 ? "MEDIUM" : "LARGE"

    const query = gql`
      query artworkPricingContextQuery(
        $artistId: String!
        $category: AnalyticsPricingContextCategoryEnum!
        $dimensions: AnalyticsPricingContextDimensionsEnum!
        $listPriceCents: Int!
      ) {
        analyticsPricingContext(
          artistId: $artistId
          category: $category
          dimensions: $dimensions
          listPriceCents: $listPriceCents
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

    const vars = {
      artistId: artist._id,
      category: category.toUpperCase(),
      dimensions,
      listPriceCents,
    }

    const result = await graphql(
      context.vortexSchema,
      query,
      null,
      context,
      vars
    )

    if (result.errors) {
      error(result.errors)
      return null
    }

    return result.data!.analyticsPricingContext
  },
}
