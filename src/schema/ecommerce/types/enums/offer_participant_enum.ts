import { GraphQLEnumType } from "graphql"

export const OrderParticipantEnum = new GraphQLEnumType({
  name: "OrderParticipantEnum",
  values: {
    BUY: {
      value: "BUYER",
      description: "Participant on the buyer side",
    },
    OFFER: {
      value: "SELLER",
      description: "Participant on the seller side",
    },
  },
})
