import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"

import { OrderType } from "schema/ecommerce/types/order"

export const OrderWithMutationSuccess = new GraphQLObjectType({
  name: "OrderWithMutationSuccess",
  isTypeOf: data => data.order,
  fields: () => ({
    order: { type: OrderType },
  }),
})

export const EcommerceError = new GraphQLObjectType({
  name: "EcommerceError",
  isTypeOf: data => data.order,
  fields: {
    description: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The error message",
    },
  },
})

export const OrderWithMutationFailure = new GraphQLObjectType({
  name: "OrderWithMutationFailure",
  isTypeOf: data => data.error,
  fields: {
    error: { type: EcommerceError },
  },
})

export const OrderOrFailureUnionType = new GraphQLUnionType({
  name: "OrderOrFailureUnionType",
  types: [OrderWithMutationSuccess, OrderWithMutationFailure],
})
