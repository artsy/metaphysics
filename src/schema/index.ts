import localSchema from "./schema"
import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { transformToV2 } from "./index_v2"

import config from "config"
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
exportedSchema = transformToV2(exportedSchema)
export default exportedSchema
