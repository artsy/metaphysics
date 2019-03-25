import { GraphQLFieldConfig } from "graphql"
import { PricingContextType } from "./PricingContextType"
import { ResolverContext } from "types/graphql"

export const PricingContext: GraphQLFieldConfig<any, ResolverContext> = {
  type: PricingContextType,
  resolve: async (
    { width_cm, height_cm, artist, category, price_hidden },
    _,
    context
  ) => {
    // fail if we don't have enough info to request a histogram
    if (price_hidden || !artist || !width_cm || !height_cm || !category) {
      return null
    }
    // this feature is only enabled for lab users right now
    if (!context.meLoader) {
      return null
    }
    const me = await context.meLoader()
    if (!me.lab_features || !me.lab_features.includes("Pricing Context")) {
      return null
    }

    const vars = {
      artistId: artist._id,
      category: category.toUpperCase(),
      widthCm: Math.round(width_cm),
      heightCm: Math.round(height_cm),
    }

    return context.pricingContextLoader(vars, context)
  },
}
