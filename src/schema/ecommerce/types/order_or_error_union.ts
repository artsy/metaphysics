import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"

import { OrderType } from "schema/ecommerce/types/order"

export const OrderWithMutationSuccess = new GraphQLObjectType({
  name: "OrderWithMutationSuccess",
  fields: () => ({
    order: { type: OrderType },
  }),
})

export const EcommerceError = new GraphQLObjectType({
  name: "EcommerceError",
  fields: {
    description: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The error message",
    },
  },
})

export const OrderWithMutationFailure = new GraphQLObjectType({
  name: "OrderWithMutationFailure",
  fields: {
    error: { type: EcommerceError },
  },
})

export const OrderOrFailureUnionType = new GraphQLUnionType({
  name: "OrderOrFailureUnionType",
  types: [OrderWithMutationSuccess, OrderWithMutationFailure],
  resolveType: object =>
    object.__typename === "EcommerceOrderWithMutationSuccess"
      ? OrderWithMutationSuccess
      : OrderWithMutationFailure,
})
