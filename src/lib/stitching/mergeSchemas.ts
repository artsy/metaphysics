import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import { executableLewittSchema } from "lib/stitching/lewitt/schema"
import _ from "lodash"

import localSchema from "../../schema"

const scalarsToKeepInMetaphysics = [
  "String",
  "ID",
  "Int",
  "Boolean",
  "PageInfo",
]

export const mergeSchemas = async () => {
  const convectionSchema = await executableConvectionSchema()
  const convectionStitching = consignmentStitchingEnvironment(
    localSchema,
    convectionSchema
  )

  const gravitySchema = await executableGravitySchema()
  const lewittSchema = await executableLewittSchema()

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [
      gravitySchema,
      localSchema,
      convectionSchema,
      lewittSchema,
      convectionStitching.extensionSchema,
    ],
    onTypeConflict: (leftType, rightType) => {
      // Generated schemas can contain astNode references vs MP's null value
      if (_.omit(leftType, ["astNode"]) === _.omit(rightType, ["astNode"])) {
        return leftType
      }
      // These scalars are the same, but maybe have different comments etc
      if (scalarsToKeepInMetaphysics.includes(leftType.name)) {
        return leftType
      }

      // Bail, this should only happen during dev time, if you are seeing this
      // you're gonna need to transform the incoming schema
      throw new Error(`During merging two schemas contain ${leftType.name}.`)
    },
    resolvers: {
      ...convectionStitching.resolvers,
    },
  })

  // Because __allowedLegacyNames isn't in the public API
  const anyMergedSchema = mergedSchema as any
  anyMergedSchema.__allowedLegacyNames = ["__id"]

  return mergedSchema
}
