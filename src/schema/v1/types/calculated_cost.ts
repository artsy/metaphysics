import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import money from "../fields/money"

export const CalculatedCostType = new GraphQLObjectType<any, ResolverContext>({
  name: "CalculatedCost",
  fields: {
    buyers_premium: money({
      name: "BuyersPremiumAmount",
      resolve: ({ buyers_premium }) => buyers_premium,
    }),
    subtotal: money({
      name: "SubtotalAmount",
      resolve: ({ subtotal }) => subtotal,
    }),
  },
})
