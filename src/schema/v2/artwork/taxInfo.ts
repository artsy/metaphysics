import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { isInAuctionResolver } from "./isInAuctionResolver"

export const CHECKOUT_TAXES_DOC_URL =
  "https://support.artsy.net/hc/en-us/articles/360047294733-How-is-sales-tax-and-VAT-handled-on-works-listed-with-secure-checkout-"
export const BID_TAXES_DOC_URL =
  "https://support.artsy.net/hc/en-us/articles/360047292933-Are-taxes-included-in-my-bid-"

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
  resolve: async (artwork, args, context) => {
    const isInAuction = await isInAuctionResolver(artwork, args, context)
    let url = CHECKOUT_TAXES_DOC_URL
    let displayText = "Taxes may apply at checkout."

    if (isInAuction) {
      displayText = "Taxes may apply after the auction."
      url = BID_TAXES_DOC_URL
    }

    return {
      displayText,
      moreInfo: {
        displayText: "Learn more.",
        url,
      },
    }
  },
}
