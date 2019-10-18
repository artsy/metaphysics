import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import money from "../fields/money"

export const CalculatedCostType = new GraphQLObjectType<any, ResolverContext>({
  name: "CalculatedCost",
  fields: {
    buyersPremium: money({
      name: "BuyersPremiumAmount",
      resolve: ({ buyersPremium }) => buyersPremium,
    }),
    subtotal: money({
      name: "SubtotalAmount",
      resolve: ({ subtotal }) => subtotal,
    }),
  },
})
