import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql"

export const OrderMutationInputType = new GraphQLInputObjectType({
  name: "SubmitOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order ID",
    },
  },
})
