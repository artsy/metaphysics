// Uploads a reviewed JSONL golden set to Phoenix as a dataset (or a new
// version of one). Setup and usage: the "Art Assistant evals" page in Notion.
//
//   yarn eval:upload --file golden-v1.jsonl --name art-assistant-golden-v1

import "../../src/lib/loadenv"
import { readDatasetFile } from "../../src/lib/evals/dataset"
import { PhoenixClient } from "../../src/lib/evals/phoenix"
import { flag, value } from "./args"

const file = value("--file")
const name = value("--name")
if (!file || !name) {
  console.error(
    "Usage: yarn eval:upload --file <jsonl> --name <dataset> [--description <text>] [--append] [--allow-unreviewed] [--dry-run]"
  )
  process.exit(1)
}

async function main() {
  const cases = readDatasetFile(file as string)

  // Real user text goes to Phoenix only after a person has looked at it.
  const unreviewed = cases.filter((c) => c.metadata.reviewStatus !== "approved")
  if (unreviewed.length && !flag("--allow-unreviewed")) {
    console.error(
      `${unreviewed.length} of ${cases.length} cases are not reviewStatus "approved" ` +
        `(e.g. ${unreviewed
          .slice(0, 5)
          .map((c) => c.id)
          .join(", ")}). Review them, or pass --allow-unreviewed.`
    )
    process.exit(1)
  }

  const seen = new Set<string>()
  const duplicate = cases
    .map((c) => c.id)
    .find((id) => seen.size === seen.add(id).size)
  if (duplicate) {
    console.error(`Duplicate caseId ${duplicate}.`)
    process.exit(1)
  }

  const categories = cases.reduce<Record<string, number>>((counts, c) => {
    const category = String(c.metadata.category ?? "none")
    counts[category] = (counts[category] ?? 0) + 1
    return counts
  }, {})
  console.log(`${cases.length} cases:`, categories)
  if (flag("--dry-run")) return

  const result = await PhoenixClient.fromEnv().uploadDataset({
    name: name as string,
    description: value("--description"),
    action: flag("--append") ? "append" : "create",
    cases: cases.map(({ input, reference, metadata }) => ({
      input,
      reference,
      metadata,
    })),
  })
  console.log(
    `Uploaded ${result.created} examples to "${name}" (dataset ${result.datasetID}, version ${result.versionID}).`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
