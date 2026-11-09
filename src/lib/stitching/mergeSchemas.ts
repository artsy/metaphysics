import type { SubschemaConfig } from "@graphql-tools/delegate"
import { stitchSchemas } from "@graphql-tools/stitch"
import {
  exchangeSubschemaConfig,
  executableExchangeSchema,
  publicTransformsForExchange,
  transformsForExchange,
} from "lib/stitching/exchange/schema"

import { GraphQLSchema } from "graphql"
import { exchangeStitchingEnvironment as exchangeStitchingEnvironmentV2 } from "./exchange/v2/stitching"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (localSchema: GraphQLSchema) => {
  const subschemas: Array<GraphQLSchema | SubschemaConfig> = [localSchema]
  const extensionSchemas = [] as string[]
  const extensionResolvers = {} as any

  const useStitchingEnvironment = ({ extensionSchema, resolvers }) => {
    if (extensionSchema) {
      extensionSchemas.push(extensionSchema)
    }
    for (const [type, fieldResolvers] of Object.entries(
      resolvers as Record<string, Record<string, unknown>>
    )) {
      extensionResolvers[type] = {
        ...extensionResolvers[type],
        ...fieldResolvers,
      }
    }
  }

  subschemas.push(exchangeSubschemaConfig(publicTransformsForExchange))

  useStitchingEnvironment(
    exchangeStitchingEnvironmentV2({
      localSchema,
      exchangeSchema: executableExchangeSchema(transformsForExchange),
    })
  )

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = stitchSchemas({
    subschemas,
    typeDefs: extensionSchemas,
    resolvers: extensionResolvers,
    mergeDirectives: true,
  })

  // Because __allowedLegacyNames isn't in the public API
  Object.defineProperty(mergedSchema, "__allowedLegacyNames", {
    value: ["__id"],
  })

  return mergedSchema
}
