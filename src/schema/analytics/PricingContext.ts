import { GraphQLFieldConfig } from "graphql"
import { PricingContextType } from "./PricingContextType"
import { ResolverContext } from "types/graphql"

export const PricingContext: GraphQLFieldConfig<any, ResolverContext> = {
  type: PricingContextType,
  resolve: async (
    { width_cm, height_cm, artist, category, price_cents, price_hidden },
    _,
    context
  ) => {
    const listPriceCents = price_cents && price_cents[0]
    // fail if we don't have enough info to request a histogram
    if (
      price_hidden ||
      !artist ||
      !width_cm ||
      !height_cm ||
      !category ||
      !listPriceCents
    ) {
      return null
    }
    // this feature is only enbaled for lab users right now
    if (!context.meLoader) {
      return null
    }
    const me = await context.meLoader()
    if (!me.lab_features || !me.lab_features.includes("Pricing Context")) {
      return null
    }

    // copying vortex to calculate the 'dimensions' field which is actually an enum of "small" | "medium" | "large"
    // https://github.com/artsy/vortex/blob/f9427ab1a182d2249c13d0ff246a378fb0c9eef0/dbt/models/sales/price_records.sql#L8
    const area = width_cm * height_cm
    const dimensions =
      area < 40 * 40 ? "SMALL" : area < 70 * 70 ? "MEDIUM" : "LARGE"

    const vars = {
      artistId: artist._id,
      category: category.toUpperCase(),
      dimensions,
      listPriceCents,
    }

    return context.pricingContextLoader(vars, context)
  },
}
