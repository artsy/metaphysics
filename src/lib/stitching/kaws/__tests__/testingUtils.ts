import { mergeSchemas } from "graphql-tools"
import { kawsStitchingEnvironmentV2 } from "../v2/stitching"
import { GraphQLSchema } from "graphql"
import { executableKawsSchema } from "../schema"
import localSchema from "schema/v2/schema"

let cachedSchema: GraphQLSchema & { transforms: any }
let stitchedSchema: ReturnType<typeof kawsStitchingEnvironmentV2>
let mergedSchema: GraphQLSchema & { transforms: any }

/** Gets a cached copy of the transformed kaws schema  */
export const getKawsTransformedSchema = async () => {
  if (!cachedSchema) {
    cachedSchema = await executableKawsSchema()
  }
  return cachedSchema
}

/** Gets a cached copy of the stitched schema, independent of being merged into the local schema */
export const getKawsStitchedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getKawsTransformedSchema()
    stitchedSchema = kawsStitchingEnvironmentV2(localSchema, cachedSchema)
  }
  return stitchedSchema
}

/** Gets a cached fully setup schema with kaws and the localSchema set up */
export const getKawsMergedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getKawsTransformedSchema()
    const { extensionSchema, resolvers } = await getKawsStitchedSchema()

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
