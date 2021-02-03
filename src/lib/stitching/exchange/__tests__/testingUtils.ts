import { mergeSchemas } from "graphql-tools"
import { exchangeStitchingEnvironment } from "../v1/stitching"
import { GraphQLSchema } from "graphql"
import { executableExchangeSchema, transformsForExchange } from "../schema"
import localSchema from "schema/v1/schema"

let cachedSchema: GraphQLSchema & { transforms: any }
let stitchedSchema: ReturnType<typeof exchangeStitchingEnvironment>
let mergedSchema: GraphQLSchema & { transforms: any }

/** Gets a cached copy of the transformed exchange schema  */
export const getExchangeTransformedSchema = async () => {
  if (!cachedSchema) {
    cachedSchema = await executableExchangeSchema(transformsForExchange)
  }
  return cachedSchema
}

/** Gets a cached copy of the stitched schema, independent of being merged into the local schema */
export const getExchangeStitchedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getExchangeTransformedSchema()
    stitchedSchema = exchangeStitchingEnvironment({
      localSchema,
      exchangeSchema: cachedSchema,
    })
  }
  return stitchedSchema
}

/** Gets a cached fully setup schema with exchange and the localSchema set up */
export const getExchangeMergedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getExchangeTransformedSchema()
    const { extensionSchema, resolvers } = await getExchangeStitchedSchema()

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
