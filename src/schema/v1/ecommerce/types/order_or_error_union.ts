import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"

import { OrderInterface } from "schema/v1/ecommerce/types/order"
import { ResolverContext } from "types/graphql"

export const OrderWithMutationSuccess = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OrderWithMutationSuccess",
  fields: () => ({
    order: { type: OrderInterface },
  }),
})

export const EcommerceError = new GraphQLObjectType<any, ResolverContext>({
  name: "EcommerceError",
  fields: {
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The error message",
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The error message",
    },
    data: {
      type: GraphQLString,
      description:
        "A data object in JSON format providing additional context about the error.",
    },
  },
})

export const OrderWithMutationFailure = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OrderWithMutationFailure",
  fields: {
    error: { type: EcommerceError },
  },
})

export const OrderOrFailureUnionType = new GraphQLUnionType({
  name: "OrderOrFailureUnionType",
  types: [OrderWithMutationSuccess, OrderWithMutationFailure],
  resolveType: (object) => {
    switch (object.__typename) {
      case "EcommerceOrderWithMutationSuccess": {
        return OrderWithMutationSuccess
      }
      case "EcommerceOrderWithMutationFailure": {
        return OrderWithMutationFailure
      }
      default:
        throw new Error("Unexpected typename on order object")
    }
  },
})
