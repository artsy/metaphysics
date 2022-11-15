import { GraphQLUnionType } from "graphql"
import { PartnerType } from "schema/v2/partner/partner"
import { UserType } from "schema/v2/user"

export const OrderPartyUnionType = new GraphQLUnionType({
  name: "OrderParty",
  types: [PartnerType, UserType],
  resolveType: (obj) => (obj.__typename === "User" ? UserType : PartnerType),
})
