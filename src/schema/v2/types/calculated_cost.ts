import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { Money } from "schema/v2/fields/money"

export const CalculatedCost = new GraphQLObjectType<any, ResolverContext>({
  name: "CalculatedCost",
  fields: {
    bidAmount: {
      type: Money,
      resolve: ({ bidAmount }) => bidAmount,
    },
    buyersPremium: {
      type: Money,
      resolve: ({ buyersPremium }) => buyersPremium,
    },
    subtotal: {
      type: Money,
      resolve: ({ subtotal }) => subtotal,
    },
  },
})
