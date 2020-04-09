import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import {
  executableExchangeSchema,
  transformsForExchange,
} from "lib/stitching/exchange/schema"
import { executableKawsSchema } from "lib/stitching/kaws/schema"
import {
  kawsStitchingEnvironmentV1,
  kawsStitchingEnvironmentV2,
} from "lib/stitching/kaws/stitching"
import config from "config"

import { GraphQLSchema } from "graphql"
import { exchangeStitchingEnvironment } from "./exchange/stitching"
import { executableVortexSchema } from "lib/stitching/vortex/schema"
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv1 } from "./vortex/stitchingv1"
import { vortexStitchingEnvironment as vortexStitchingEnvironmentv2 } from "./vortex/stitching"
import { gravityStitchingEnvironment } from "./gravity/stitching"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (
  localSchema,
  version: 1 | 2,
  testConfig?: any
) => {
  const environment = testConfig || config

  const {
    ENABLE_COMMERCE_STITCHING,
    ENABLE_CONSIGNMENTS_STITCHING,
  } = environment

  const schemas = [localSchema] as GraphQLSchema[]
  const extensionSchemas = [] as string[]
  const extensionResolvers = {} as any

  const useStitchingEnvironment = ({ extensionSchema, resolvers }) => {
    extensionSchemas.push(extensionSchema)
    for (const [type, fieldResolvers] of Object.entries(resolvers as object)) {
      extensionResolvers[type] = {
        ...extensionResolvers[type],
        ...fieldResolvers,
      }
    }
  }

  const gravitySchema = executableGravitySchema()
  schemas.push(gravitySchema)

  useStitchingEnvironment(gravityStitchingEnvironment(localSchema))

  if (ENABLE_COMMERCE_STITCHING) {
    const exchangeSchema = executableExchangeSchema(transformsForExchange)
    schemas.push(exchangeSchema)

    useStitchingEnvironment(
      exchangeStitchingEnvironment({ localSchema, exchangeSchema, version })
    )
  }

  if (ENABLE_CONSIGNMENTS_STITCHING) {
    const convectionSchema = executableConvectionSchema()
    schemas.push(convectionSchema)

    useStitchingEnvironment(
      consignmentStitchingEnvironment(localSchema, convectionSchema)
    )
  }

  const vortexSchema = executableVortexSchema()
  schemas.push(vortexSchema)

  // TODO: Remove reference to v1 once reaction is migrated and we ensure this works in CMS.
  if (version === 1) {
    useStitchingEnvironment(vortexStitchingEnvironmentv1(localSchema))
  } else {
    useStitchingEnvironment(vortexStitchingEnvironmentv2(localSchema))
  }

  // Always stitch kaws
  const kawsSchema = executableKawsSchema()
  schemas.push(kawsSchema)

  // TODO: In v2 we dropped the legacy style filter artworks, so this needs to
  //       be redone with the new connection.
  if (version === 1) {
    useStitchingEnvironment(kawsStitchingEnvironmentV1(localSchema, kawsSchema))
  } else {
    useStitchingEnvironment(kawsStitchingEnvironmentV2(localSchema, kawsSchema))
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
