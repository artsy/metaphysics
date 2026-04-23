import { readFileSync } from "fs"
import {
  RenameRootFields,
  RenameTypes,
  TransformInterfaceFields,
  TransformObjectFields,
  wrapSchema,
} from "@graphql-tools/wrap"
import { linkToExecutor } from "@graphql-tools/links"
import { buildSchema } from "graphql"
import { createExchangeLink } from "./link"
import { ReplaceCommerceDateTimeType } from "./transformers/replaceCommerceDateTimeType"

export const executableExchangeSchema = (transforms) => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const exchangeLink = createExchangeLink()

  return wrapSchema({
    schema: buildSchema(exchangeSDL, { assumeValidSDL: true }),
    executor: linkToExecutor(exchangeLink),
    transforms,
  })
}

export const transformsForExchange = [
  // Apply a prefix to all the typenames
  new RenameTypes((name) => {
    return `Commerce${name}`
  }),
  // Rename all the root fields to be camelCased
  new RenameRootFields(
    (_operation, name) =>
      `commerce${name.charAt(0).toUpperCase() + name.slice(1)}`
  ),
  // replace CommerceDateTime field with MP's dateField
  new TransformInterfaceFields(ReplaceCommerceDateTimeType),
  new TransformObjectFields(ReplaceCommerceDateTimeType),
]

export const legacyTransformsForExchange = [
  // Apply a prefix to all the typenames
  // for Legacy merged schema approach
  new RenameTypes((name) => {
    return `Ecommerce${name}`
  }),
  // Rename all the root fields to be camelCased
  new RenameRootFields(
    (_operation, name) =>
      `ecommerce${name.charAt(0).toUpperCase() + name.slice(1)}`
  ),
]
