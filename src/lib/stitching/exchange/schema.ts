import { createStressLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableStressSchema = async () => {
  const stressSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const stressLink = createStressLink()

  const schema = await makeRemoteExecutableSchema({
    schema: stressSDL,
    link: stressLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      return `Ecommerce${name}`
    }),
    new RenameRootFields((_operation, name) => `ecommerce_${name}`),
  ])
}
