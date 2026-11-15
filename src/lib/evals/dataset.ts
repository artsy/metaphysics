import { readFileSync } from "fs"
import type { EvalCase } from "./types"

/**
 * A local dataset file: one `{input, output, metadata}` object per line, the
 * same three columns a Phoenix dataset has. `output` is the reference.
 */
export function readDatasetFile(path: string): EvalCase[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, number }) => {
      let record: any
      try {
        record = JSON.parse(line)
      } catch (error) {
        throw new Error(`${path}:${number}: not JSON (${error})`)
      }
      if (typeof record?.input?.message !== "string") {
        throw new Error(`${path}:${number}: input.message must be a string`)
      }
      const metadata = record.metadata ?? {}
      return {
        id: String(metadata.caseId ?? `line-${number}`),
        input: record.input,
        reference: record.output ?? {},
        metadata,
      }
    })
}
