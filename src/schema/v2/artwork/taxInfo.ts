import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { isEligibleForOnPlatformTransaction } from "./utilities"

export const CHECKOUT_TAXES_DOC_URL =
  "https://support.artsy.net/hc/en-us/articles/360047294733-How-is-sales-tax-and-VAT-handled-on-works-listed-with-secure-checkout-"

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
