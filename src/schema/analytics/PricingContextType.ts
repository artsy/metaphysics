import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { amount } from "schema/fields/money"

export const HistogramBinType = new GraphQLObjectType({
  name: "AnalyticsHistogramBin",
  description: "Histogram bin for pricing context",
  fields: {
    minPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    minPrice: amount(bin => bin.minPriceCents),
    maxPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    maxPrice: amount(bin => bin.maxPriceCents),
    numArtworks: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

export const PricingContextType = new GraphQLObjectType({
  name: "AnalyticsPricingContext",
  description: "Price context for listed artworks.",
  fields: {
    filterDescription: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The description of the filters being used to generate the contextual data.",
    },
    bins: {
      type: new GraphQLNonNull(new GraphQLList(HistogramBinType)),
    },
  },
})
