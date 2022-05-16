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
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv1 } from "./vortex/v1/stitching"
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv2 } from "./vortex/v2/stitching"
import { gravityStitchingEnvironment as gravityStitchingEnvironmentV1 } from "./gravity/v1/stitching"
import { gravityStitchingEnvironment as gravityStitchingEnvironmentV2 } from "./gravity/v2/stitching"
import { exchangeStitchingEnvironment as exchangeStitchingEnvironmentV1 } from "./exchange/v1/stitching"
import { exchangeStitchingEnvironment as exchangeStitchingEnvironmentV2 } from "./exchange/v2/stitching"
import { consignmentStitchingEnvironment as convectionStitchingEnvironmentV1 } from "./convection/v1/stitching"
import { consignmentStitchingEnvironment as convectionStitchingEnvironmentV2 } from "./convection/v2/stitching"
import { causalityStitchingEnvironment as causalityStitchingEnvironmentV1 } from "./causality/v1/stitching"
import { causalityStitchingEnvironment as causalityStitchingEnvironmentV2 } from "./causality/v2/stitching"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (localSchema, version: 1 | 2) => {
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

  if (version === 1) {
    useStitchingEnvironment(
      gravityStitchingEnvironmentV1(localSchema, gravitySchema)
    )
  } else {
    useStitchingEnvironment(
      gravityStitchingEnvironmentV2(localSchema, gravitySchema)
    )
  }

  const causalitySchema = executableCausalitySchema()
  schemas.push(causalitySchema)

  if (version === 1) {
    useStitchingEnvironment(
      causalityStitchingEnvironmentV1({
        causalitySchema,
        localSchema,
      })
    )
  } else {
    useStitchingEnvironment(
      causalityStitchingEnvironmentV2({
        causalitySchema,
        localSchema,
      })
    )
  }

  const diffusionSchema = executableDiffusionSchema()
  schemas.push(diffusionSchema)

  const exchangeSchema = executableExchangeSchema(transformsForExchange)
  schemas.push(exchangeSchema)

  if (version === 1) {
    useStitchingEnvironment(
      exchangeStitchingEnvironmentV1({ localSchema, exchangeSchema })
    )
  } else {
    useStitchingEnvironment(
      exchangeStitchingEnvironmentV2({ localSchema, exchangeSchema })
    )
  }

  const convectionSchema = executableConvectionSchema()
  schemas.push(convectionSchema)

  if (version === 1) {
    useStitchingEnvironment(
      convectionStitchingEnvironmentV1(localSchema, convectionSchema)
    )
  } else {
    useStitchingEnvironment(
      convectionStitchingEnvironmentV2(localSchema, convectionSchema)
    )
  }

  const vortexSchema = executableVortexSchema()
  schemas.push(vortexSchema)

  // TODO: Remove reference to v1 once reaction is migrated and we ensure this works in CMS.
  if (version === 1) {
    useStitchingEnvironment(vortexStitchingEnvironmentv1(localSchema))
  } else {
    useStitchingEnvironment(
      vortexStitchingEnvironmentv2(localSchema, gravitySchema)
    )
  }

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

// The end goal:
//
// export const mergeSchemas = async () => {
//   const convectionSchema = await executableConvectionSchema()
//   const convectionStitching = consignmentStitchingEnvironment(
//     localSchema,
//     convectionSchema
//   )

//   const gravitySchema = await executableGravitySchema()
//   const exchangeSchema = await executableExchangeSchema()

//   // The order should only matter in that extension schemas come after the
//   // objects that they are expected to build upon
//   const mergedSchema = _mergeSchemas({
//     schemas: [
//       gravitySchema,
//       localSchema,
//       convectionSchema,
//       exchangeSchema,
//       convectionStitching.extensionSchema,
//     ],
//     resolvers: {
//       ...convectionStitching.resolvers,
//     },
//   })

//   // Because __allowedLegacyNames isn't in the public API
//   const anyMergedSchema = mergedSchema as any
//   anyMergedSchema.__allowedLegacyNames = ["__id"]

//   return mergedSchema
// }
