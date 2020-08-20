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
const whitelistedRootFields: string[] = []
const privateFields: string[] = ["lotStandings"]
const permittedRootFields = [...whitelistedRootFields, ...privateFields]

export const executableCausalitySchema = () => {
  const causalityLink = createCausalityLink()
  const causalityTypeDefs = readFileSync("src/data/causality.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: causalityTypeDefs,
    link: causalityLink,
    buildSchemaOptions: {
      assumeValidSDL: true,
    },
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new FilterTypes((type) => !blacklistedTypes.includes(type.name)),
    new FilterRootFields((_operation, name, _field) => {
      return permittedRootFields.includes(name)
    }),
    new RenameTypes((name) => {
      // this could be left as AuctionsLong, it is just a scalar (same as int?)
      // we should verify that JSON + javascript can hold all possible values
      // we would send (at least 800 billion * 100)
      // also we need to manually add this to the schema - figure out why it isn't
      // exported
      if (name === "Long") return "Long"
      if (name === "Lot") name = "LotState"
      if (name === "Sale") name = "SaleState"
      return `Auctions${name}`
    }),
    new RenameRootFields((_operation, name) => {
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
      if (privateFields.includes(name)) {
        return `_unused_auctions${capitalizedName}`
      }
      return `auctions${capitalizedName}`
    }),
  ])
}
