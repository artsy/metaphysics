import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLID,
} from "graphql"
export const InitialOfferInputType = new GraphQLInputObjectType({
  name: "InitialOfferOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "BSON ID of artwork",
    },
    amountCents: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Offer amount in cents",
    },
  },
})
