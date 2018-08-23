import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"

import { OrderType } from "schema/ecommerce/types/order"

//TODO: use EcommerceOrderOrFailureUnionType for all ecommerce query/mutations
export const OrderReturnType = new GraphQLObjectType({
  name: "OrderReturnType",
  fields: {
    order: {
      type: OrderType,
      description: "Returned order object",
    },
    errors: {
      type: new GraphQLList(GraphQLString),
      description: "Errors",
    },
  },
})
