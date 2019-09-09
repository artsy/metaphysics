import { GraphQLUnionType } from "graphql"
import Partner from "schema/v2/partner"
import { UserType } from "schema/v2/user"

export const OrderPartyUnionType = new GraphQLUnionType({
  name: "OrderParty",
  types: [Partner.type, UserType],
  resolveType: obj => (obj.__typename === "User" ? UserType : Partner.type),
})
