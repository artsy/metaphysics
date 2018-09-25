import localSchema from "./schema"
import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"

import config from "config"
const { ENABLE_SCHEMA_STITCHING } = config

// Default to the existing metaphysics schema
let exportedSchema = localSchema

// If ENABLE_SCHEMA_STITCHING is set in the env
// then stitch
const enableSchemaStitching = !!ENABLE_SCHEMA_STITCHING
if (enableSchemaStitching) {
  try {
    console.warn("[FEATURE] Enabling Schema Stitching")
    exportedSchema = incrementalMergeSchemas()
  } catch (err) {
    console.log("Error merging schemas:", err)
  }
}

export default exportedSchema
