import { danger, fail, markdown } from "danger"
import { printSchema } from "graphql/utilities/schemaPrinter"
import { readFileSync } from "fs"
import * as prettier from "prettier"
import * as jsdiff from "diff"

// Rule: encourage all new files to be TypeScript
const jsAppFiles = danger.git.created_files.filter(
  f => f.startsWith("src/") && f.endsWith(".js")
)
const testFiles = danger.git.created_files
  .concat(danger.git.modified_files)
  .filter(f => f.includes(".test.ts") || f.includes(".test.js"))

if (jsAppFiles.length) {
  const listed = danger.github.utils.fileLinks(jsAppFiles)
  fail(`Please use <code>*.ts</code> for new files. Found: ${listed}.`)
}

// Grab the built schema to skip all the babel path faff
import schema from "./build/src/schema"

// Compare a printed copy of the schema
// with the file in the repo.
const schemaText = printSchema(schema as any, { commentDescriptions: true })
const prettySchema = prettier.format(schemaText, { parser: "graphql" })
const localGQL = readFileSync("_schema.graphql", "utf8")
if (prettySchema !== localGQL) {
  fail(`Please update the schema in the root of the app via:

\`yarn dump-schema _schema.graphql\`

Note: This script uses your current \`.env\` variables.
`)
  const diff = jsdiff.createPatch(
    "_schema.graphql",
    localGQL,
    prettySchema,
    "Version in Repo",
    "Added in this PR"
  )
  markdown("The changes to the Schema:\n\n```diff\n" + diff + "```")
}

danger.git
  .structuredDiffForFile("_schema.graphql")
  .then(diff => {
    if (diff) {
      diff.chunks.forEach(chunk => {
        chunk.changes.forEach(change => {
          if (change.type === "add") {
            const offence = /^\+\s*([a-zA-Z]+_\w*):/.exec(change.content)
            if (offence) {
              fail(
                "Found addition using snake_case instead of camelCase: " +
                  offence[1],
                "_schema.graphql",
                change.ln
              )
            }
          }
        })
      })
    }
    return
  })
  .catch(console.error)

// Make sure we don't leave in any testing shortcuts (ex: `it.only`)
const testingShortcuts = ["it.only", "describe.only"]
testFiles.forEach(file => {
  const content = readFileSync(file, "utf8")
  testingShortcuts.forEach(shortcut => {
    if (content.includes(shortcut)) {
      fail(`Found a testing shortcut ${shortcut} left in by accident.`, file)
    }
  })
})
