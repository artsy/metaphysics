import { GraphQLEnumType } from "graphql"

export const CancelReasonTypeEnum = new GraphQLEnumType({
  name: "CancelReasonType",
  values: {
    SELLER_LAPSED: {
      value: "SELLER_LAPSED",
    },
    SELLER_REJECTED_OFFER_TOO_LOW: {
      value: "SELLER_REJECTED_OFFER_TOO_LOW",
    },
    SELLER_REJECTED_SHIPPING_UNAVAILABLE: {
      value: "SELLER_REJECTED_SHIPPING_UNAVAILABLE",
    },
    SELLER_REJECTED_ARTWORK_UNAVAILABLE: {
      value: "SELLER_REJECTED_ARTWORK_UNAVAILABLE",
    },
    SELLER_REJECTED_OTHER: {
      value: "SELLER_REJECTED_OTHER",
    },
  },
})
