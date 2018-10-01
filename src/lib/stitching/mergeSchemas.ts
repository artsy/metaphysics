import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import { executableExchangeSchema } from "lib/stitching/exchange/schema"
import config from "config"

import localSchema from "schema/schema"
import { GraphQLSchema } from "graphql"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (testConfig?: any) => {
  const environment = testConfig || config

  const {
    ENABLE_GRAVQL_ONLY_STITCHING,
    ENABLE_ECOMMERCE_STITCHING,
    ENABLE_CONSIGNMENTS_STITCHING,
  } = environment

  const schemas = [localSchema] as GraphQLSchema[]
  const extensionSchemas = [] as string[]
  const extensionResolvers = {} as any

  if (ENABLE_GRAVQL_ONLY_STITCHING) {
    const gravitySchema = executableGravitySchema()
    schemas.push(gravitySchema)
  }

  if (ENABLE_ECOMMERCE_STITCHING) {
    const exchangeSchema = executableExchangeSchema()
    schemas.push(exchangeSchema)
  }

  if (ENABLE_CONSIGNMENTS_STITCHING) {
    const convectionSchema = executableConvectionSchema()
    schemas.push(convectionSchema)

    const { extensionSchema, resolvers } = consignmentStitchingEnvironment(
      localSchema,
      convectionSchema
    )
    extensionSchemas.push(extensionSchema)
    for (var attr in resolvers) {
      extensionResolvers[attr] = resolvers[attr]
    }
  }

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [...schemas, ...extensionSchemas],
    resolvers: extensionResolvers,
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
//   // const lewittSchema = await executableLewittSchema()
//   const exchangeSchema = await executableExchangeSchema()

//   // The order should only matter in that extension schemas come after the
//   // objects that they are expected to build upon
//   const mergedSchema = _mergeSchemas({
//     schemas: [
//       gravitySchema,
//       localSchema,
//       convectionSchema,
//       // lewittSchema,
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
