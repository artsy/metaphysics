import { createExchangeLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableExchangeSchema = () => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const exchangeLink = createExchangeLink()

  const schema = makeRemoteExecutableSchema({
    schema: exchangeSDL,
    link: exchangeLink,
  })

  // Return the new modified schema
  return transformSchema(schema, transformsForExchange)
  // Note that changes in this will need to be
}

export const transformsForExchange = [
  // Apply a prefix to all the typenames
  new RenameTypes(name => {
    return `Ecommerce${name}`
  }),
  // Rename all the root fields to be camelCased
  new RenameRootFields(
    (_operation, name) =>
      `ecommerce${name.charAt(0).toUpperCase() + name.slice(1)}`
  ),
]
