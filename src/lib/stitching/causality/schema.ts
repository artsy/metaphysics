import { createCausalityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
  FilterRootFields,
  FilterTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

const blacklistedTypes: string[] = []
const whitelistedRootFields: string[] = [
  "lotStandings",
  // "auctionIncrementPolicy",
  // "auctionIncrementPolicies",
  // "auctionIncrementPolicyGroups",
]

export const executableCausalitySchema = () => {
  const threeBodyLink = createCausalityLink()
  const threeBodyTypeDefs = readFileSync("src/data/causality.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: threeBodyTypeDefs,
    link: threeBodyLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new FilterTypes((type) => !blacklistedTypes.includes(type.name)),
    new FilterRootFields((operation, name, _field) => {
      // We are currently obscuring all root fields
      if (operation === "Query") return whitelistedRootFields.includes(name)
      if (operation === "Mutation") return false
      return true
    }),
    new RenameTypes((name) => {
      // this could be left as AuctionsLong, it is just a scalar (same as int?)
      if (name === "Long") return "Long"
      // if (name === "Lot") name = "LotState"
      // if (name === "Sale") name = "SaleState"
      return `Auctions${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `auctions${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
