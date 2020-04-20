import { mergeSchemas } from "graphql-tools"
import { gravityStitchingEnvironment } from "../stitching"
import { GraphQLSchema } from "graphql"
import { executableGravitySchema } from "../schema"
import localSchema from "schema/v2/schema"

let cachedSchema: GraphQLSchema & { transforms: any }
let stitchedSchema: ReturnType<typeof gravityStitchingEnvironment>
let mergedSchema: GraphQLSchema & { transforms: any }

/** Gets a cached copy of the transformed gravity schema  */
export const getGravityTransformedSchema = async () => {
  if (!cachedSchema) {
    cachedSchema = await executableGravitySchema()
  }
  return cachedSchema
}

/** Gets a cached copy of the stitched schema, independent of being merged into the local schema */
export const getGravityStitchedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getGravityTransformedSchema()
    stitchedSchema = gravityStitchingEnvironment(localSchema, cachedSchema)
  }
  return stitchedSchema
}

/** Gets a cached fully setup schema with gravity and the localSchema set up */
export const getGravityMergedSchema = async () => {
  if (!mergedSchema) {
    const cachedSchema = await getGravityTransformedSchema()
    const { extensionSchema, resolvers } = await getGravityStitchedSchema()

    // The order should only matter in that extension schemas come after the
    // objects that they are expected to build upon
    mergedSchema = mergeSchemas({
      schemas: [localSchema, cachedSchema, extensionSchema],
      resolvers: resolvers,
    }) as GraphQLSchema & { transforms: any }

    const anyMergedSchema = mergedSchema as any
    anyMergedSchema.__allowedLegacyNames = ["__id"]
  }
  return mergedSchema
}
