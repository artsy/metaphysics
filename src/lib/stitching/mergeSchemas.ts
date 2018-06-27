import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import { executableLewittSchema } from "lib/stitching/lewitt/schema"
import { executableExchangeSchema } from "lib/stitching/exchange/schema"

import localSchema from "../../schema"

export const mergeSchemas = async () => {
  const convectionSchema = await executableConvectionSchema()
  const convectionStitching = consignmentStitchingEnvironment(
    localSchema,
    convectionSchema
  )

  const gravitySchema = await executableGravitySchema()
  const lewittSchema = await executableLewittSchema()
  const exchangeSchema = await executableExchangeSchema()

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [
      gravitySchema,
      localSchema,
      convectionSchema,
      lewittSchema,
      exchangeSchema,
      convectionStitching.extensionSchema,
    ],
    resolvers: {
      ...convectionStitching.resolvers,
    },
  })

  // Because __allowedLegacyNames isn't in the public API
  const anyMergedSchema = mergedSchema as any
  anyMergedSchema.__allowedLegacyNames = ["__id"]

  return mergedSchema
}
