import localSchema from "./schema"
import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { transformToV2 } from "./index_v2"

import config from "config"
import { GraphQLEnumType } from "graphql"
const { DISABLE_SCHEMA_STITCHING } = config

// Default to the existing metaphysics schema
let exportedSchema = localSchema
// If DISABLE_SCHEMA_STITCHING is set in the env
// then don't stitch
const enableSchemaStitching = !DISABLE_SCHEMA_STITCHING
if (enableSchemaStitching) {
  try {
    if (typeof jest == "undefined") {
      console.warn("[FEATURE] Enabling Schema Stitching")
    }
    exportedSchema = incrementalMergeSchemas()
  } catch (err) {
    console.log("Error merging schemas:", err)
  }
}
export const schema = exportedSchema
export const schemaV2 = transformToV2(exportedSchema)

// Our hot-fix to graphql-tools changes the serialize method on all the
// GraphQLEnumType instances to pass the value through as-is, however as we
// still want to also use the original v1 schema we need to undo that change
// here.
Object.keys(schema.getTypeMap()).forEach(typeName => {
  const type = schema.getType(typeName)
  if (type instanceof GraphQLEnumType) {
    delete type.serialize
  }
})

export default exportedSchema
