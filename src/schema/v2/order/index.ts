import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { LineItemType } from "./lineItem"
import { FulfillmentOptionUnionType } from "./fulfillmentOption"

export const OrderType = new GraphQLObjectType<any, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Phone number of the buyer",
      resolve: ({ buyer_phone_number }) => buyer_phone_number,
    },
    fulfillmentOptions: {
      type: new GraphQLList(FulfillmentOptionUnionType),
      resolve: ({ fulfillment_options }) => fulfillment_options,
    },
    lineItems: {
      type: new GraphQLList(LineItemType),
      resolve: ({ line_items, ...order }) =>
        line_items.map((lineItem) => ({
          lineItem,
          order,
        })),
    },
  },
})

export const Order: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  type: OrderType,
  resolve: async (_root, { id }, { meOrderLoader }) => {
    if (!meOrderLoader) return null
    const order = await meOrderLoader(id)
    console.log("order", order)
    // const orderResolver = new OrderResolver(order)
    // console.log("orderResolver", orderResolver)

    return order
  },
}
