import { createCausalityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

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
    new RenameTypes(name => {
      return `Causality${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `causality${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
