import { GraphQLUnionType } from "graphql"
import Partner from "schema/partner"
import { UserType } from "schema/user"

export const OrderPartyUnionType = new GraphQLUnionType({
  name: "OrderParty",
  types: [Partner.type, UserType],
  resolveType: obj => (obj.__typename === "User" ? UserType : Partner.type),
})
