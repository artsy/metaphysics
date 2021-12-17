import { buildSchema } from "graphql"
const { diff: schemaDiff } = require("@graphql-inspector/core")
import fetch from "node-fetch"
import { warn, danger } from "danger"

// If there is a breaking change between the local schema,
// and the current Force one, warn.
export default async () => {
  const forceSchemaUrl =
    "https://github.com/artsy/force/raw/main/data/schema.graphql"

  const forceSchema = await (await fetch(forceSchemaUrl)).text()
  const repo = danger.github.pr.head.repo.full_name
  const sha = danger.github.pr.head.sha
  const localSchema = await (
    await fetch(
      `https://raw.githubusercontent.com/${repo}/${sha}/_schemaV2.graphql`
    )
  ).text()

  const allChanges = schemaDiff(
    buildSchema(forceSchema),
    buildSchema(localSchema)
  )
  const breakings = allChanges.filter((c) => c.criticality.level === "BREAKING")
  const messages = breakings.map((c) => c.message)
  if (messages.length) {
    warn(
      `The V2 schema in this PR has breaking changes with Force. Remember to update the Force schema if necessary.

${messages.join("\n")}`
    )
  }
}
