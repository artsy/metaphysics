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

export const OrderWithMutationFailure = new GraphQLObjectType({
  name: "OrderWithMutationFailure",
  fields: {
    error: { type: EcommerceError },
  },
})

export const OrderOrFailureUnionType = new GraphQLUnionType({
  name: "OrderOrFailureUnionType",
  types: [
    OrderWithMutationSuccess,
    OrderWithMutationFailure,
    OrderType,
    EcommerceError,
  ],
  resolveType: object => {
    switch (object.__typename) {
      case "EcommerceOrderWithMutationSuccess": {
        return OrderWithMutationSuccess
      }
      case "EcommerceOrderWithMutationFailure": {
        return OrderWithMutationFailure
      }
      case "EcommerceOrder": {
        return OrderType
      }
      case "EcommerceApplicationError": {
        return EcommerceError
      }
    }
  },
})
