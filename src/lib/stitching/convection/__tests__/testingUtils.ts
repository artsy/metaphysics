import { executableConvectionSchema } from "../schema"

import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
  getFieldsForTypeFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { consignmentStitchingEnvironment } from "../v2/stitching"

import { mergeSchemas } from "graphql-tools"
import { GraphQLSchema } from "graphql"
import localSchema from "schema/v2/schema"

/**
 * Common helpers for use in our tests
 */
export async function useConvectionStitching() {
  const schema = await getConvectionMergedSchema()
  const getFields = async (type) =>
    await getFieldsForTypeFromSchema(type, schema)
  const rootFields = await getRootFieldsFromSchema(schema)
  const { resolvers } = await getConvectionStitchedSchema()
  const types = await getTypesFromSchema(schema)

  return {
    getFields,
    rootFields,
    resolvers,
    schema,
    types,
  }
}

/**
 * The following is used for internal setup, initializing convection's schema /
 * stitching environment and then caching the results.
 */

let cachedSchema: GraphQLSchema & { transforms: any }
let stitchedSchema: ReturnType<typeof consignmentStitchingEnvironment>
let mergedSchema: GraphQLSchema & { transforms: any }

/**
 * Gets a cached copy of the transformed convection schema
 */
const getConvectionTransformedSchema = async () => {
  if (!cachedSchema) {
    cachedSchema = await executableConvectionSchema()
  }
  return cachedSchema
}

/**
 * Gets a cached copy of the stitched schema, independent of being merged into
 * the local schema
 */
const getConvectionStitchedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getConvectionTransformedSchema()
    stitchedSchema = consignmentStitchingEnvironment(localSchema, cachedSchema)
  }
  return stitchedSchema
}

/**
 * Gets a cached fully setup schema with convection and the localSchema
 */
const getConvectionMergedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getConvectionTransformedSchema()
    const { extensionSchema, resolvers } = await getConvectionStitchedSchema()

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
