import { GraphQLEnumType } from "graphql"

export const OrderParticipantEnum = new GraphQLEnumType({
  name: "OrderParticipantEnum",
  values: {
    BUYER: {
      value: "BUYER",
      description: "Participant on the buyer side",
    },
    SELLER: {
      value: "SELLER",
      description: "Participant on the seller side",
    },
  },
})
