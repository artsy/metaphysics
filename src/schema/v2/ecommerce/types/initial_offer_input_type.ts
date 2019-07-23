import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from "graphql"
import { MoneyInput } from "schema/v2/fields/money"

export const InitialOfferInputType = new GraphQLInputObjectType({
  name: "InitialOfferOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "ID of order",
    },
    offerPrice: {
      type: MoneyInput,
      description: "Offer price",
    },
    note: {
      type: GraphQLString,
      description: "Offer note",
    },
  },
})
