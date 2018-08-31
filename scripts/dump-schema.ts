import fs from "fs"
import path from "path"
import schema from "schema"
import { printSchema } from "graphql/utilities"

const message =
  "Usage: dump-schema.js /path/to/output/directory or /path/to/filename.graphql"

const destination = process.argv[2]
if (destination === undefined) {
  console.error(message)
  process.exit(1)
}

// Support both passing a folder or a filename
const folder = path.dirname(destination)
const filename = path.basename(destination) || "schema.graphql"
if (!fs.existsSync(folder)) {
  console.error(message)
  process.exit(1)
}

// Save user readable type system shorthand of schema
fs.writeFileSync(
  path.join(folder, filename),
  printSchema(schema, { commentDescriptions: true }),
  "utf8"
)
