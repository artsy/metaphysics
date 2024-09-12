import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { isEligibleForOnPlatformTransaction } from "./utilities"

export const CHECKOUT_TAXES_DOC_URL =
  "https://support.artsy.net/s/article/How-are-taxes-and-customs-fees-calculated"

const TaxMoreInfoType = new GraphQLObjectType({
  name: "TaxMoreInfo",
  fields: {
    displayText: {
      type: new GraphQLNonNull(GraphQLString),
    },
    url: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

const TaxInfoType = new GraphQLObjectType({
  name: "TaxInfo",
  fields: {
    displayText: {
      type: new GraphQLNonNull(GraphQLString),
    },
    moreInfo: {
      type: new GraphQLNonNull(TaxMoreInfoType),
    },
  },
})

export const TaxInfo = {
  type: TaxInfoType,
  resolve: async (artwork) => {
    if (!isEligibleForOnPlatformTransaction(artwork)) {
      return null
    }

    return {
      displayText: "Taxes may apply at checkout.",
      moreInfo: {
        displayText: "Learn more.",
        url: CHECKOUT_TAXES_DOC_URL,
      },
    }
  },
}
