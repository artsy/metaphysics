import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"

import { OrderType } from "schema/ecommerce/types/order"

//TODO: use OrderReturnType for all ecomerce query/mutations
export const OrderReturnType = new GraphQLObjectType({
  name: "OrderReturnType",
  fields: {
    order: {
      type: OrderType,
      decription: "Returned order object",
    },
    errors: {
      type: new GraphQLList(GraphQLString),
      decription: "Errors",
    },
  },
})
