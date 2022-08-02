// This means that  the .env.example is first applied (setting defaults)
// then your .env is applied (it's set up in the schema files)
// ensuring consistency across dev's machines
//
require("dotenv").config({
  path: require("path").join(process.cwd(), ".env.example"),
})

import fs from "fs"
import { printSchema } from "graphql/utilities"
import path from "path"
import { schema } from "../src/schema/v2"
import prettier from "prettier"
import { graphql, introspectionQuery } from "graphql"

const message =
  "Usage: dump-schema.js /path/to/output/directory or /path/to/filename.graphql or /path/to/schema.json"

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

if (schemaPath.endsWith("json")) {
  console.log(`Dumping JSON to ${schemaPath}`)
  graphql(schema, introspectionQuery).then(
    (result) => {
      const prettierResult = prettier.format(JSON.stringify(result), {
        parser: "json",
      })
      fs.writeFileSync(path.join(schemaPath), prettierResult)
    },
    (error) => {
      console.error(
        "ERROR introspecting schema: ",
        JSON.stringify(error, null, 2)
      )
    }
  )
} else {
  console.log(`Dumping SDL to ${schemaPath}`)
  // commentDescriptions means it uses # instead of the ugly """
  const schemaText = printSchema(schema, { commentDescriptions: true })
  const prettySchema = prettier.format(schemaText, { parser: "graphql" })

  // Save user readable type system shorthand of schema
  fs.writeFileSync(schemaPath, prettySchema, "utf8")
}
