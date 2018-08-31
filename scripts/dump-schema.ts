import fs from "fs"
import path from "path"
import schema from "schema"
import { printSchema } from "graphql/utilities"

const destination = process.argv[2]
if (destination === undefined || !fs.existsSync(destination)) {
  console.error("Usage: dump-schema.js /path/to/output/directory")
  process.exit(1)
}

// Save user readable type system shorthand of schema
fs.writeFileSync(
  path.join(destination, "schema.graphql"),
  printSchema(schema, { commentDescriptions: true })
)
