import { GraphQLEnumType } from "graphql"

export const SaleAgreementStatusEnum = new GraphQLEnumType({
  name: "SaleAgreementStatus",
  values: {
    ARCHIVED: { value: "archived" },
    CURRENT: { value: "current" },
    PAST: { value: "past" },
  },
})
