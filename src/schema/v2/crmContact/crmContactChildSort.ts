import { GraphQLEnumType } from "graphql"

// Shared by the email, location and address connections of a CRM contact
export const CRMContactChildSortEnum = new GraphQLEnumType({
  name: "CRMContactChildSort",
  values: {
    CREATED_AT_ASC: { value: "created_at" },
    CREATED_AT_DESC: { value: "-created_at" },
  },
})
