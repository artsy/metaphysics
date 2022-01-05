import { createPositronLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executablePositronSchema = () => {
  const positronLink = createPositronLink()
  const positronTypeDefs = readFileSync("src/data/positron.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: positronTypeDefs,
    link: positronLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes((name) => {
      return `Editorial${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `editorial${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
