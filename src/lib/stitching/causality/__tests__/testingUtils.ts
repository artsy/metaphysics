import { executableCausalitySchema } from "../schema"

import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
  getFieldsForTypeFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { causalityStitchingEnvironment as causalityStitchingEnvironmentV2 } from "../v2/stitching"

import { mergeSchemas } from "graphql-tools"
import { GraphQLSchema } from "graphql"
import localSchema from "schema/v2/schema"

/**
 * Common helpers for use in our tests
 */
export async function useCausalityStitching() {
  const schema = await getCausalityMergedSchema()
  const getFields = async (type) =>
    await getFieldsForTypeFromSchema(type, schema)
  const rootFields = await getRootFieldsFromSchema(schema)
  const { resolvers } = await getCausalityStitchedSchema()
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
 * The following is used for internal setup, initializing causality's schema /
 * stitching environment and then caching the results.
 */

let cachedSchema: GraphQLSchema & { transforms: any }
let stitchedSchema: ReturnType<typeof causalityStitchingEnvironmentV2>
let mergedSchema: GraphQLSchema & { transforms: any }

/**
 * Gets a cached copy of the transformed causality schema
 */
const getCausalityTransformedSchema = async () => {
  if (!cachedSchema) {
    cachedSchema = await executableCausalitySchema()
  }
  return cachedSchema
}

/**
 * Gets a cached copy of the stitched schema, independent of being merged into
 * the local schema
 */
const getCausalityStitchedSchema = async () => {
  if (!stitchedSchema) {
    const causalitySchema = await getCausalityTransformedSchema()
    stitchedSchema = causalityStitchingEnvironmentV2({
      localSchema,
      causalitySchema,
    })
  }
  return stitchedSchema
}

/**
 * Gets a cached fully setup schema with causality and the localSchema
 */
const getCausalityMergedSchema = async () => {
  if (!stitchedSchema) {
    const cachedSchema = await getCausalityTransformedSchema()
    const { extensionSchema, resolvers } = await getCausalityStitchedSchema()

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
