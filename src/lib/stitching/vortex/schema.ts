import { createVortexLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableVortexSchema = () => {
  const vortexLink = createVortexLink()
  const vortexTypeDefs = readFileSync("src/data/vortex.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: vortexTypeDefs,
    link: vortexLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      return `Analytics${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `analytics${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
