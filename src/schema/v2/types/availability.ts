import { GraphQLEnumType } from "graphql"

export const Availability = new GraphQLEnumType({
  name: "Availability",
  values: {
    FOR_SALE: {
      value: "for sale",
    },
    SOLD: {
      value: "sold",
    },
    ON_LOAN: {
      value: "on loan",
    },
    ON_HOLD: {
      value: "on hold",
    },
    PERMANENT_COLLECTION: {
      value: "permanent collection",
    },
    NOT_FOR_SALE: {
      value: "not for sale",
    },
  },
})
