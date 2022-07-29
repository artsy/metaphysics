import { danger, fail, markdown, warn } from "danger"
import { printSchema } from "graphql/utilities/schemaPrinter"
import { readFileSync } from "fs"
import * as prettier from "prettier"
import * as jsdiff from "diff"

// Grab the built schema to skip all the babel path faff
import { schema } from "./src/schema/v2"

export default async () => {
  // Rule: encourage all new files to be TypeScript
  const jsAppFiles = danger.git.created_files.filter(
    (f) => f.startsWith("src/") && f.endsWith(".js")
  )
  const testFiles = danger.git.created_files
    .concat(danger.git.modified_files)
    .filter((f) => f.includes(".test.ts") || f.includes(".test.js"))

  if (jsAppFiles.length) {
    const listed = danger.github.utils.fileLinks(jsAppFiles)
    fail(`Please use <code>*.ts</code> for new files. Found: ${listed}.`)
  }

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

  const diff = await danger.git.structuredDiffForFile("_schema.graphql")
  if (diff) {
    const skipCamelCaseCheck = danger.github.pr.body.includes("#skip_camel")
    const violation = skipCamelCaseCheck ? warn : fail
    let failed = false
    diff.chunks.forEach((chunk) => {
      chunk.changes.forEach((change) => {
        if (change.type === "add") {
          const offence = /^\+\s*([a-zA-Z]+_\w*):/.exec(change.content)
          if (offence) {
            failed = true
            violation(
              "Addition uses `snake_case` instead of `camelCase`: " +
                "`" +
                offence[1] +
                "`",
              "_schema.graphql",
              change.ln
            )
          }
        }
      })
    })
    if (!skipCamelCaseCheck && failed) {
      fail(
        "Failed due to [`snake_case` field naming](https://github.com/artsy/README/blob/main/playbooks/graphql-schema-design.md#how-to-model-our-graph). " +
          "If you want to skip this check add `#skip_camel` to your post body and re-run CI."
      )
    }
  }

  // Make sure we don't leave in any testing shortcuts (ex: `it.only`)
  const testingShortcuts = ["it.only", "describe.only"]
  testFiles.forEach((file) => {
    const content = readFileSync(file, "utf8")
    testingShortcuts.forEach((shortcut) => {
      if (content.includes(shortcut)) {
        fail(`Found a testing shortcut ${shortcut} left in by accident.`, file)
      }
    })
  })

  // No `debugger` statements.
  danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
    .forEach((file) => {
      const content = readFileSync(file, "utf8")
      if (content.includes("debugger")) {
        fail(`Found a debugger statement left in by accident.`, file)
      }
    })

  // Query map should only ever be appended to.
  const queryMapDiff = await danger.git.diffForFile(
    "src/data/complete.queryMap.json"
  )

  if (!queryMapDiff) return

  // 2 because a normal change has two removed lines (the last query, which gets
  // a comma added to it) and the ending brace bracket.
  if (queryMapDiff.removed.split("\n").length > 2) {
    const hashtag = "#allowdestructivequerymap"
    const skipCheck = danger.github.pr.body.includes(hashtag)
    if (!skipCheck) {
      fail(
        "The `complete.queryMap.json` file appears to have had queries removed from it. " +
          `This file must only ever be appended to. Include ${hashtag} to PR description to bypass this check.`
      )
    }
  }
}
