import { GraphQLEnumType } from "graphql"

export const OrderFulfillmentTypeEnum = new GraphQLEnumType({
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
