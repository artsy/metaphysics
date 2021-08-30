import localSchema from "./schema"
import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { incrementalMergeSchemas2 } from "lib/stitching2/mergeSchemas"
import { lexicographicSortSchema } from "graphql"
import config from "config"

const {
  DISABLE_SCHEMA_STITCHING,
  ENABLE_EXPERIMENTAL_STITCHING_MIGRATION,
} = config

// Default to the existing metaphysics schema
let exportedSchema = localSchema

export async function getSchema() {
  const enableSchemaStitching = !DISABLE_SCHEMA_STITCHING
  if (enableSchemaStitching) {
    try {
      if (typeof jest == "undefined") {
        console.warn("[V2] [FEATURE] Enabling Schema Stitching")
      }
      exportedSchema = incrementalMergeSchemas(exportedSchema, 2)
    } catch (err) {
      console.log("[V2] Error merging schemas:", err)
    }
  }

  // TODO: Remove this flag once stitching lib is upgraded
  if (ENABLE_EXPERIMENTAL_STITCHING_MIGRATION) {
    try {
      if (typeof jest == "undefined") {
        console.warn(
          "[V2] [ENABLE_EXPERIMENTAL_STITCHING_MIGRATION] Enabling experimental Schema Stitching migration"
        )
      }
      exportedSchema = await incrementalMergeSchemas2(exportedSchema, 2)
    } catch (err) {
      console.log(
        "[V2] [ENABLE_EXPERIMENTAL_STITCHING_MIGRATION] Error merging schemas:",
        err
      )
    }
  }

  const schema = lexicographicSortSchema(exportedSchema)
  return schema
}
