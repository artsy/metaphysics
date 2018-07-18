import { GraphQLEnumType } from "graphql"

export const OrderFulfillmentType = new GraphQLEnumType({
  name: "OrderFulfillmentType",
  values: {
    SHIP: {
      value: "SHIP",
    },
    PICKUP: {
      value: "PICKUP",
    },
  },
})
