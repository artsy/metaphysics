import { readFileSync } from "fs"
import {
  RenameRootFields,
  RenameTypes,
  TransformInterfaceFields,
  TransformObjectFields,
  wrapSchema,
} from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { linkToExecutor } from "lib/stitching/lib/linkToExecutor"
import { buildSchema } from "graphql"
import { createExchangeLink } from "./link"
import { ReplaceCommerceDateTimeType } from "./transformers/replaceCommerceDateTimeType"

export const exchangeSubschemaConfig = (transforms): SubschemaConfig => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  const exchangeLink = createExchangeLink()

  return {
    schema: buildSchema(exchangeSDL, { assumeValidSDL: true }),
    executor: linkToExecutor(exchangeLink),
    transforms,
  }
}

export const executableExchangeSchema = (transforms) =>
  wrapSchema(exchangeSubschemaConfig(transforms))

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
