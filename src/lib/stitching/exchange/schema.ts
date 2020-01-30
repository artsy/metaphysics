import { createExchangeLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
  FilterRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"
import { ReplaceCommerceDateTimeType } from "./transformers/replaceCommerceDateTimeType"

export const executableExchangeSchema = transforms => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const exchangeLink = createExchangeLink()

  const schema = makeRemoteExecutableSchema({
    schema: exchangeSDL,
    link: exchangeLink,
  })

  // Return the new modified schema
  return transformSchema(schema, transforms)
  // Note that changes in this will need to be
}

const removeRootFieldList = ["myOrders"]

export const transformsForExchange = [
  new FilterRootFields(
    (_operation, name) => !removeRootFieldList.includes(name)
  ),
  // Apply a prefix to all the typenames
  new RenameTypes(name => {
    return `Commerce${name}`
  }),
  // Rename all the root fields to be camelCased
  new RenameRootFields(
    (_operation, name) =>
      `commerce${name.charAt(0).toUpperCase() + name.slice(1)}`
  ),
  // replace CommerceDateTime field with MP's dateField
  new ReplaceCommerceDateTimeType(),
]

export const legacyTransformsForExchange = [
  // Apply a prefix to all the typenames
  // for Legacy merged schema approach
  new RenameTypes(name => {
    return `Ecommerce${name}`
  }),
  // Rename all the root fields to be camelCased
  new RenameRootFields(
    (_operation, name) =>
      `ecommerce${name.charAt(0).toUpperCase() + name.slice(1)}`
  ),
]
