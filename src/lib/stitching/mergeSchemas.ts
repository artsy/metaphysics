import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import { executableExchangeSchema } from "lib/stitching/exchange/schema"
import config from "config"

const {
  ENABLE_GRAVQL_ONLY_STITCHING,
  ENABLE_ORDER_STITCHING,
  ENABLE_CONSIGNMENTS_STITCHING,
} = config

import localSchema from "../../schema"

export const incrementalMergeSchemas = async () => {
  const schemas = [] as any[]
  const extensionSchemas = [] as any[]
  const resolvers = {} as any

  if (ENABLE_GRAVQL_ONLY_STITCHING) {
    const gravitySchema = await executableGravitySchema()
    schemas.push(gravitySchema)
  }

  if (ENABLE_ORDER_STITCHING) {
    const exchangeSchema = await executableExchangeSchema()
    schemas.push(exchangeSchema)
  }

  if (ENABLE_CONSIGNMENTS_STITCHING) {
    const convectionSchema = await executableConvectionSchema()
    const convectionStitching = consignmentStitchingEnvironment(
      localSchema,
      convectionSchema
    )

    schemas.push(convectionSchema)
    extensionSchemas.push(convectionStitching.extensionSchema)
    for (var attr in convectionStitching.resolvers) {
      resolvers[attr] = convectionStitching.resolvers[attr]
    }
  }

  // Add the MP schema last
  schemas.push(localSchema)

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [...schemas, ...extensionSchemas],
    resolvers,
  })

  // Because __allowedLegacyNames isn't in the public API
  const anyMergedSchema = mergedSchema as any
  anyMergedSchema.__allowedLegacyNames = ["__id"]

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
//   const lewittSchema = await executableLewittSchema()
//   const exchangeSchema = await executableExchangeSchema()

//   // The order should only matter in that extension schemas come after the
//   // objects that they are expected to build upon
//   const mergedSchema = _mergeSchemas({
//     schemas: [
//       gravitySchema,
//       localSchema,
//       convectionSchema,
//       lewittSchema,
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
