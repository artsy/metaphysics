import { buildSchema } from "graphql"
import { readFileSync } from "fs"
const { diff: schemaDiff } = require("@graphql-inspector/core")
import fetch from "node-fetch"

// If there is a breaking change between the local schema,
// and the current Reaction one, warn.
;(async () => {
  const forcePackageJSON = await (await fetch(
    "https://raw.githubusercontent.com/artsy/force/release/package.json"
  )).json()
  const reactionVersion = forcePackageJSON["dependencies"]["@artsy/reaction"]
  const reactionSchemaUrl = `https://github.com/artsy/reaction/raw/v${reactionVersion}/data/schema.graphql`

  const reactionSchema = await (await fetch(reactionSchemaUrl)).text()
  const localSchema = readFileSync("_schemaV2.graphql", "utf8")

  const allChanges = schemaDiff(
    buildSchema(reactionSchema),
    buildSchema(localSchema)
  )
  const breakings = allChanges.filter(c => c.criticality.level === "BREAKING")
  const messages = breakings.map(c => c.message)
  if (messages.length) {
    warn(
      `The V2 schema in this PR has breaking changes with production Force. Remember to update Reaction if necessary:\n\n${messages}`
    )
  }
})()
