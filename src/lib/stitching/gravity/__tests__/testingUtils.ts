import { GraphQLSchemaWithTransforms, mergeSchemas } from "graphql-tools"
import localSchema from "schema/v2/schema"
import { executableGravitySchema } from "../schema"
import { gravityStitchingEnvironment as gravityStitchingEnvironmentV2 } from "../v2/stitching"

let cachedSchema: GraphQLSchemaWithTransforms

/** Gets a cached copy of the transformed gravity schema  */
export const getGravityTransformedSchema = async () => {
  if (!cachedSchema) {
    /* eslint-disable require-atomic-updates */
    cachedSchema = await executableGravitySchema()
  }
  return cachedSchema
}

/** Gets a cached copy of the stitched schema, independent of being merged into the local schema */
export const getGravityStitchedSchema = async () => {
  const cachedSchema = await getGravityTransformedSchema()
  return gravityStitchingEnvironmentV2(localSchema, cachedSchema)
}

/** Gets a cached fully setup schema with gravity and the localSchema set up */
export const getGravityMergedSchema = async () => {
  const cachedSchema = await getGravityTransformedSchema()
  const { extensionSchema, resolvers } = await getGravityStitchedSchema()

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const schemas = [localSchema, cachedSchema]
  if (extensionSchema) {
    schemas.push(extensionSchema)
  }

  // Filter out undefined resolver properties
  const filteredResolvers = Object.fromEntries(
    Object.entries(resolvers).filter(([_, value]) => value !== undefined)
  )

  const mergedSchema = mergeSchemas({
    schemas,
    resolvers: filteredResolvers,
  }) as GraphQLSchemaWithTransforms

  const anyMergedSchema = mergedSchema as any
  anyMergedSchema.__allowedLegacyNames = ["__id"]

  return mergedSchema
}
