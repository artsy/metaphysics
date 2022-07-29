import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableCausalitySchema } from "lib/stitching/causality/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import {
  executableExchangeSchema,
  transformsForExchange,
} from "lib/stitching/exchange/schema"
import { executableDiffusionSchema } from "lib/stitching/diffusion/schema"
import { executableVortexSchema } from "lib/stitching/vortex/schema"

import { GraphQLSchema } from "graphql"
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv2 } from "./vortex/v2/stitching"
import { gravityStitchingEnvironment as gravityStitchingEnvironmentV2 } from "./gravity/v2/stitching"
import { exchangeStitchingEnvironment as exchangeStitchingEnvironmentV2 } from "./exchange/v2/stitching"
import { consignmentStitchingEnvironment as convectionStitchingEnvironmentV2 } from "./convection/v2/stitching"
import { causalityStitchingEnvironment as causalityStitchingEnvironmentV2 } from "./causality/v2/stitching"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (localSchema) => {
  const schemas = [localSchema] as GraphQLSchema[]
  const extensionSchemas = [] as string[]
  const extensionResolvers = {} as any

  const useStitchingEnvironment = ({ extensionSchema, resolvers }) => {
    extensionSchemas.push(extensionSchema)
    for (const [type, fieldResolvers] of Object.entries(
      resolvers as Record<string, Record<string, unknown>>
    )) {
      extensionResolvers[type] = {
        ...extensionResolvers[type],
        ...fieldResolvers,
      }
    }
  }

  const gravitySchema = executableGravitySchema()
  schemas.push(gravitySchema)

  useStitchingEnvironment(
    gravityStitchingEnvironmentV2(localSchema, gravitySchema)
  )

  const causalitySchema = executableCausalitySchema()
  schemas.push(causalitySchema)

  useStitchingEnvironment(
    causalityStitchingEnvironmentV2({
      causalitySchema,
      localSchema,
    })
  )

  const diffusionSchema = executableDiffusionSchema()
  schemas.push(diffusionSchema)

  const exchangeSchema = executableExchangeSchema(transformsForExchange)
  schemas.push(exchangeSchema)

  useStitchingEnvironment(
    exchangeStitchingEnvironmentV2({ localSchema, exchangeSchema })
  )

  const convectionSchema = executableConvectionSchema()
  schemas.push(convectionSchema)

  useStitchingEnvironment(
    convectionStitchingEnvironmentV2(localSchema, convectionSchema)
  )

  const vortexSchema = executableVortexSchema()
  schemas.push(vortexSchema)

  useStitchingEnvironment(
    vortexStitchingEnvironmentv2(localSchema, gravitySchema)
  )

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [...schemas, ...extensionSchemas],
    resolvers: extensionResolvers,
    mergeDirectives: true,
  })

  // Because __allowedLegacyNames isn't in the public API
  Object.defineProperty(mergedSchema, "__allowedLegacyNames", {
    value: ["__id"],
  })

  return mergedSchema
}
