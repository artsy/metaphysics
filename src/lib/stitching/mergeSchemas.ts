import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import {
  executableExchangeSchema,
  transformsForExchange,
} from "lib/stitching/exchange/schema"
import { executableKawsSchema } from "lib/stitching/kaws/schema"
import { kawsStitchingEnvironment } from "lib/stitching/kaws/stitching"
import config from "config"

import { GraphQLSchema } from "graphql"
import { exchangeStitchingEnvironment } from "./exchange/stitching"
import { executableVortexSchema } from "lib/stitching/vortex/schema"
import { vortexStitchingEnvironment } from "./vortex/stitching"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (localSchema, testConfig?: any) => {
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
    for (const [type, fieldResolvers] of Object.entries(resolvers)) {
      extensionResolvers[type] = {
        ...extensionResolvers[type],
        ...fieldResolvers,
      }
    }
  }

  const gravitySchema = executableGravitySchema()
  schemas.push(gravitySchema)

  if (ENABLE_COMMERCE_STITCHING) {
    const exchangeSchema = executableExchangeSchema(transformsForExchange)
    schemas.push(exchangeSchema)

    useStitchingEnvironment(
      exchangeStitchingEnvironment(localSchema, exchangeSchema)
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
  useStitchingEnvironment(vortexStitchingEnvironment(localSchema))

  // Always stitch kaws
  const kawsSchema = executableKawsSchema()
  schemas.push(kawsSchema)

  useStitchingEnvironment(kawsStitchingEnvironment(localSchema, kawsSchema))

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [...schemas, ...extensionSchemas],
    resolvers: extensionResolvers,
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
