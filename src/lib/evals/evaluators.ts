/**
 * Code evaluators: deterministic checks on one run of one case. Each returns
 * a score where higher is better, except the plain measurements (steps,
 * latency, cost, failed searches), whose names say what they count.
 * `score: null` means "not applicable here" and keeps the case out of that
 * evaluator's average.
 */

import { parse, valueFromASTUntyped, visit } from "graphql"
import { truncate } from "lib/helpers"
import type {
  EvalCase,
  EvalConstraints,
  EvalRunOutput,
  EvalScore,
} from "./types"

const code = (
  name: string,
  score: number | null,
  explanation?: string,
  label?: string
): EvalScore => ({
  name,
  kind: "CODE",
  score,
  ...(label !== undefined ? { label } : {}),
  ...(explanation !== undefined ? { explanation } : {}),
})

/** Every `query_artsy` call of the turn, in order. */
export const toolCalls = (output: EvalRunOutput) =>
  output.steps.flatMap((step) => step.toolCalls)

export function answered(output: EvalRunOutput): EvalScore {
  const ok = output.stopReason === "stop" && !!output.message?.trim()
  return code(
    "answered",
    ok ? 1 : 0,
    ok ? undefined : `stopReason=${output.stopReason}`,
    ok ? "yes" : "no"
  )
}

/** The `{}` bug: a tool call with no query is a wasted step. */
export function toolArgsPresent(output: EvalRunOutput): EvalScore {
  const calls = toolCalls(output)
  if (calls.length === 0) return code("tool_args_present", null)
  const empty = calls.filter((call) => !call.query?.trim()).length
  return code(
    "tool_args_present",
    empty === 0 ? 1 : 0,
    empty ? `${empty} of ${calls.length} calls had no query` : undefined
  )
}

export function failedSearches(output: EvalRunOutput): EvalScore {
  const failures = toolCalls(output).filter((call) => call.ok === false)
  return code(
    "failed_searches",
    failures.length,
    failures.length
      ? failures.map((call) => truncate(call.result, 160)).join(" | ")
      : undefined
  )
}

export const steps = (output: EvalRunOutput): EvalScore =>
  code("steps", output.steps.length)

export const latencySeconds = (output: EvalRunOutput): EvalScore =>
  code("latency_s", Math.round(output.latencyMs / 100) / 10)

export const costUSD = (output: EvalRunOutput): EvalScore =>
  code(
    "cost_usd",
    output.costUSD === null ? null : Math.round(output.costUSD * 1e5) / 1e5
  )

export const cardCount = (output: EvalRunOutput): EvalScore =>
  code("cards", output.cards.length)

/**
 * The assistant's tokens over all steps of the turn (not the judge's).
 * `input_tokens` includes cached input; `cache_read_tokens` is the part of
 * it served from the cache, billed at the cheaper cache-read rate.
 */
export function tokens(output: EvalRunOutput): EvalScore[] {
  let input = 0
  let cacheRead = 0
  let outputCount = 0
  for (const step of output.steps) {
    input += step.inputTokens ?? 0
    cacheRead += step.cacheReadTokens ?? 0
    outputCount += step.outputTokens ?? 0
  }
  return [
    code("input_tokens", input),
    code("cache_read_tokens", cacheRead),
    code("output_tokens", outputCount),
    code("total_tokens", input + outputCount),
  ]
}

export function expectedSection(
  output: EvalRunOutput,
  testCase: EvalCase
): EvalScore {
  const expected = testCase.reference.expectedSection
  if (!expected || expected === "ANY") return code("expected_section", null)
  const actual = output.sectionType ?? "NONE"
  return code(
    "expected_section",
    actual === expected ? 1 : 0,
    `expected ${expected}, got ${actual}`,
    actual
  )
}

type SearchArgs = Record<string, unknown>

/**
 * The arguments of every artwork search the turn ran (`artworksConnection`,
 * `filterArtworksConnection`, at any depth), with variables resolved. A query
 * that doesn't parse ran no search.
 */
function artworkSearches(output: EvalRunOutput): SearchArgs[] {
  const searches: SearchArgs[] = []
  for (const call of toolCalls(output)) {
    if (!call.query) continue
    let document
    try {
      document = parse(call.query)
    } catch {
      continue
    }
    const variables = (call.variables ?? {}) as Record<string, unknown>
    visit(document, {
      Field(field) {
        if (!/artworksConnection$/i.test(field.name.value)) return
        searches.push(
          Object.fromEntries(
            (field.arguments ?? []).map((arg) => [
              arg.name.value,
              valueFromASTUntyped(arg.value, variables),
            ])
          )
        )
      },
    })
  }
  return searches
}

/** `"*-5000"` → `{min: 0, max: 5000}`; anything else → null. */
function priceRange(value: unknown): { min: number; max: number } | null {
  const match =
    typeof value === "string" &&
    /^(\*|\d+(?:\.\d+)?)-(\*|\d+(?:\.\d+)?)$/.exec(value)
  if (!match) return null
  return {
    min: match[1] === "*" ? 0 : Number(match[1]),
    max: match[2] === "*" ? Infinity : Number(match[2]),
  }
}

/**
 * Did the artwork searches carry the filters the collector stated? Checks
 * the queries, not the cards: the cards' prices are display strings in many
 * currencies. A small tolerance on the ceiling allows "around $5,000".
 */
export function constraintFilters(
  output: EvalRunOutput,
  testCase: EvalCase
): EvalScore {
  const constraints: EvalConstraints = testCase.metadata.constraints ?? {}
  const searches = artworkSearches(output)
  const checks: Array<[string, boolean]> = []

  if (searches.length === 0) {
    const stated =
      constraints.priceMaxUSD != null ||
      constraints.priceMinUSD != null ||
      constraints.forSale === true
    return code(
      "constraint_filters",
      stated && testCase.reference.expectedSection === "ARTWORKS" ? 0 : null,
      stated ? "no artwork search ran" : undefined
    )
  }

  const anySearch = (test: (args: SearchArgs) => boolean) => searches.some(test)

  if (constraints.priceMaxUSD != null) {
    const ceiling = constraints.priceMaxUSD
    checks.push([
      `priceRange max <= ${ceiling}`,
      anySearch((args) => {
        const range = priceRange(args.priceRange)
        return !!range && range.max <= ceiling * 1.1
      }),
    ])
  }
  if (constraints.priceMinUSD != null) {
    const floor = constraints.priceMinUSD
    checks.push([
      `priceRange min >= ${floor}`,
      anySearch((args) => {
        const range = priceRange(args.priceRange)
        return !!range && range.min >= floor * 0.9
      }),
    ])
  }
  if (constraints.forSale === true) {
    checks.push(["forSale: true", anySearch((args) => args.forSale === true)])
  }
  if (constraints.medium) {
    checks.push([
      `medium (${constraints.medium})`,
      anySearch(
        (args) =>
          (Array.isArray(args.additionalGeneIDs) &&
            args.additionalGeneIDs.length > 0) ||
          !!args.medium
      ),
    ])
  }

  if (checks.length === 0) return code("constraint_filters", null)
  const passed = checks.filter(([, ok]) => ok).length
  return code(
    "constraint_filters",
    passed / checks.length,
    checks.map(([name, ok]) => `${ok ? "✓" : "✗"} ${name}`).join(", ")
  )
}

export const CODE_EVALUATORS: Array<(
  output: EvalRunOutput,
  testCase: EvalCase
) => EvalScore | EvalScore[]> = [
  answered,
  expectedSection,
  constraintFilters,
  toolArgsPresent,
  failedSearches,
  steps,
  cardCount,
  latencySeconds,
  costUSD,
  tokens,
]

export function runCodeEvaluators(
  output: EvalRunOutput,
  testCase: EvalCase
): EvalScore[] {
  return CODE_EVALUATORS.flatMap((evaluate) => evaluate(output, testCase))
}
