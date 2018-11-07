import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLID,
  GraphQLString,
} from "graphql"

const MoneyInputAmount = new GraphQLInputObjectType({
  name: "OfferAmountInput",
  fields: {
    amount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "amount",
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "ISO 4217 Currency code of the this amount, https://en.wikipedia.org/wiki/ISO_4217",
    },
  },
})
export const InitialOfferInputType = new GraphQLInputObjectType({
  name: "InitialOfferOrderInput",
  fields: {
    orderId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "ID of order",
    },
    offerAmount: {
      type: MoneyInputAmount,
      description: "Offer amount in cents",
    },
  },
})
