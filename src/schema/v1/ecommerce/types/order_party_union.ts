import { GraphQLUnionType } from "graphql"
import { PartnerType } from "schema/v1/partner"
import { UserType } from "schema/v1/user"

export const OrderPartyUnionType = new GraphQLUnionType({
  name: "OrderParty",
  types: [PartnerType, UserType],
  resolveType: (obj) => (obj.__typename === "User" ? UserType : PartnerType),
})
