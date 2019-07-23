import { GraphQLEnumType } from "graphql"

export const OrderModeEnum = new GraphQLEnumType({
  name: "OrderModeEnum",
  values: {
    BUY: {
      value: "BUY",
      description: "Order initiated by Buy",
    },
    OFFER: {
      value: "OFFER",
      description: "Order initiated by Offer",
    },
  },
})
