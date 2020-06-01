import { createKawsLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableKawsSchema = () => {
  const kawsLink = createKawsLink()
  const kawsTypeDefs = readFileSync("src/data/kaws.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: kawsTypeDefs,
    link: kawsLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes((name) => {
      return `Marketing${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `marketing${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
