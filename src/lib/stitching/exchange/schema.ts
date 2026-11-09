import { readFileSync } from "fs"
import {
  FilterRootFields,
  RenameRootFields,
  RenameTypes,
  TransformInterfaceFields,
  TransformObjectFields,
  wrapSchema,
} from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { buildSchema } from "graphql"
import { createExchangeExecutor } from "./link"
import { ReplaceCommerceDateTimeType } from "./transformers/replaceCommerceDateTimeType"

export const exchangeSubschemaConfig = (transforms): SubschemaConfig => {
  const exchangeSDL = readFileSync("src/data/exchange.graphql", "utf8")
  return {
    schema: buildSchema(exchangeSDL, { assumeValidSDL: true }),
    executor: createExchangeExecutor(),
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

/**
 * Temporary scaffolding while Exchange is unstitched: root fields hidden from
 * MP's public schema. `executableExchangeSchema` stays unfiltered, so the
 * stitching extensions can still delegate to them.
 */
export const hiddenExchangeRootFields = new Set([
  // No client usage (Force, Eigen, Volt and Datadog checked)
  "commerceAbandonedOrders",
  "commerceCompetingOrders",
  "commerceConfirmFulfillment",
  "commerceLineItems",
  "commerceUpdateImpulseConversationId",
  // Only used internally: `createInquiryOrder`, `createInquiryOfferOrder` and
  // `submitOfferOrderWithConversation` delegate to these
  "commerceCreateInquiryOfferOrderWithArtwork",
  "commerceCreateInquiryOrderWithArtwork",
  "commerceSubmitOrderWithOffer",
])

export const publicTransformsForExchange = [
  ...transformsForExchange,
  new FilterRootFields(
    (_operation, fieldName) => !hiddenExchangeRootFields.has(fieldName)
  ),
]
