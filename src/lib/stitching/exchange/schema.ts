import { createExchangeLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableExchangeSchema = async () => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const exchangeLink = createExchangeLink()

  const schema = await makeRemoteExecutableSchema({
    schema: exchangeSDL,
    link: exchangeLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      return `Ecommerce${name}`
    }),
    new RenameRootFields((_operation, name) => `ecommerce_${name}`),
  ])
}
