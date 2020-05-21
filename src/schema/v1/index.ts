import localSchema from "./schema"
import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import config from "config"
import { lexicographicSortSchema } from "graphql"

const { DISABLE_SCHEMA_STITCHING } = config

// Default to the existing metaphysics schema
let exportedSchema = localSchema
// If DISABLE_SCHEMA_STITCHING is set in the env
// then don't stitch
const enableSchemaStitching = !DISABLE_SCHEMA_STITCHING
if (enableSchemaStitching) {
  try {
    if (typeof jest == "undefined") {
      console.warn("[V1] [FEATURE] Enabling Schema Stitching")
    }
    exportedSchema = incrementalMergeSchemas(exportedSchema, 1)
  } catch (err) {
    console.log("[V1] Error merging schemas:", err)
  }
}
export const schema = lexicographicSortSchema(exportedSchema)

export default exportedSchema
