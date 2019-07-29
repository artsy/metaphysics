import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql"

export const OrderMutationInputType = new GraphQLInputObjectType({
  name: "OrderMutationInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
  },
})
