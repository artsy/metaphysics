import { buildSchema } from "graphql"
const { diff: schemaDiff } = require("@graphql-inspector/core")
import fetch from "node-fetch"
import { warn, danger } from "danger"

// If there is a breaking change between the local schema,
// and the current Reaction one, warn.
export default async () => {
  const forcePackageJSON = await (await fetch(
    "https://raw.githubusercontent.com/artsy/force/master/package.json"
  )).json()
  const reactionVersion = forcePackageJSON["dependencies"]["@artsy/reaction"]
  const reactionSchemaUrl = `https://github.com/artsy/reaction/raw/v${reactionVersion}/data/schema.graphql`

  const reactionSchema = await (await fetch(reactionSchemaUrl)).text()
  const repo = danger.github.pr.head.repo.full_name
  const sha = danger.github.pr.head.sha
  const localSchema = await (await fetch(
    `https://raw.githubusercontent.com/${repo}/${sha}/_schemaV2.graphql`
  )).text()

  const allChanges = schemaDiff(
    buildSchema(reactionSchema),
    buildSchema(localSchema)
  )
  const breakings = allChanges.filter(c => c.criticality.level === "BREAKING")
  const messages = breakings.map(c => c.message)
  if (messages.length) {
    warn(
      `The V2 schema in this PR has breaking changes with Force. Remember to update Reaction if necessary.
      
${messages.join("\n")}`
    )
  }
}
