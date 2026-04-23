import { stitchSchemas } from "@graphql-tools/stitch"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import {
  causalitySubschemaConfig,
  executableCausalitySchema,
} from "lib/stitching/causality/schema"
import {
  convectionSubschemaConfig,
  executableConvectionSchema,
} from "lib/stitching/convection/schema"
import {
  exchangeSubschemaConfig,
  executableExchangeSchema,
  transformsForExchange,
} from "lib/stitching/exchange/schema"
import { diffusionSubschemaConfig } from "lib/stitching/diffusion/schema"
import {
  vortexSubschemaConfig,
  executableVortexSchema,
} from "lib/stitching/vortex/schema"

import { GraphQLSchema } from "graphql"
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv2 } from "./vortex/v2/stitching"
import { exchangeStitchingEnvironment as exchangeStitchingEnvironmentV2 } from "./exchange/v2/stitching"
import { consignmentStitchingEnvironment as convectionStitchingEnvironmentV2 } from "./convection/v2/stitching"
import { causalityStitchingEnvironment as causalityStitchingEnvironmentV2 } from "./causality/v2/stitching"

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

  subschemas.push(causalitySubschemaConfig())

  useStitchingEnvironment(
    causalityStitchingEnvironmentV2({
      causalitySchema: executableCausalitySchema(),
      localSchema,
    })
  )

  subschemas.push(diffusionSubschemaConfig())

  subschemas.push(exchangeSubschemaConfig(transformsForExchange))

  useStitchingEnvironment(
    exchangeStitchingEnvironmentV2({
      localSchema,
      exchangeSchema: executableExchangeSchema(transformsForExchange),
    })
  )

  subschemas.push(convectionSubschemaConfig())

  useStitchingEnvironment(
    convectionStitchingEnvironmentV2(localSchema, executableConvectionSchema())
  )

  subschemas.push(vortexSubschemaConfig())

  useStitchingEnvironment(vortexStitchingEnvironmentv2(localSchema))

  // Reference the wrapped vortex schema so `executableVortexSchema` stays
  // reachable for stitching resolvers that look up fields on it.
  void executableVortexSchema

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
