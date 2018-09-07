import fs from "fs"
import { printSchema } from "graphql/utilities"
import path from "path"
import schema from "schema"

const message =
  "Usage: dump-schema.js /path/to/output/directory or /path/to/filename.graphql"

const destination = process.argv[2]
if (destination === undefined) {
  console.error(message)
  process.exit(1)
}

// Support both passing a folder or a filename
const schemaPath =
  fs.existsSync(destination) && fs.statSync(destination).isDirectory()
    ? path.join(destination, "schema.graphql")
    : destination

// Save user readable type system shorthand of schema
fs.writeFileSync(
  schemaPath,
  printSchema(schema, { commentDescriptions: true }),
  "utf8"
)
