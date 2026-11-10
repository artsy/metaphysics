/**
 * The end-of-run summary: for each candidate, a yes/no on switching from the
 * baseline and the handful of numbers behind it. Every score is still in
 * Phoenix and runs.jsonl; this is only what decides the change.
 */

import { sumBy } from "lodash"
import { pairedComparison, perCaseMeans } from "./stats"
import type { ScoredRun } from "./stats"

/** Below this many cases a verdict is a hint, not a decision. */
const MIN_CASES = 20
/** Above this share of failed runs (turn or judge), no verdict. */
const MAX_FAILED = 0.05

interface Row {
  metric: string
  name: string
  format: (n: number) => string
  higherIsBetter: boolean
  /** Part of the answer's quality, so it decides the verdict. */
  quality: boolean
}

const percent = (n: number) => `${Math.round(n * 100)}%`
const decimal = (n: number) => n.toFixed(1)

const row = (
  metric: string,
  name: string,
  format: Row["format"],
  higherIsBetter: boolean,
  quality = false
): Row => ({ metric, name, format, higherIsBetter, quality })

const ROWS: Row[] = [
  row("answered", "Answered", percent, true, true),
  row("judge_useful", "Useful (1–5)", decimal, true, true),
  row("judge_constraints", "Respects constraints", percent, true, true),
  row("judge_grounded", "Grounded in results", percent, true, true),
  row("latency_s", "Latency", (n) => `${decimal(n)}s`, false),
  row("steps", "Steps", decimal, false),
  row("cost_usd", "Cost per answer", (n) => `$${n.toFixed(3)}`, false),
  row(
    "total_tokens",
    "Tokens per answer",
    (n) => `${Math.round(n / 1000)}k`,
    false
  ),
]

interface Compared {
  row: Row
  baseline: number
  candidate: number
  change: "better" | "worse" | "same"
  /** Candidate vs baseline in percent, for the cost and speed rows. */
  percent: number
}

function compare(
  runs: ScoredRun[],
  baseline: string,
  candidate: string,
  row: Row
): Compared | null {
  const c = pairedComparison(runs, baseline, candidate, row.metric)
  if (!c) return null
  // A difference counts only when its 95% interval excludes 0.
  const real = c.ciLow > 0 || c.ciHigh < 0
  const up = c.diff > 0
  return {
    row,
    baseline: c.baseline,
    candidate: c.candidate,
    change: !real ? "same" : up === row.higherIsBetter ? "better" : "worse",
    percent: c.baseline ? (c.diff / c.baseline) * 100 : 0,
  }
}

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(Math.round(n))}%`

function verdict(rows: Compared[], judged: boolean): string {
  const quality = (change: Compared["change"]) =>
    rows
      .filter((r) => r.row.quality && r.change === change)
      .map((r) => r.row.name.toLowerCase())
      .join(", ")
  // Cost and latency moves in one direction, e.g. "+67% latency".
  const moves = (change: Compared["change"]) =>
    rows
      .filter(
        (r) =>
          (r.row.metric === "cost_usd" || r.row.metric === "latency_s") &&
          r.change === change
      )
      .map(
        (r) => `${signed(r.percent)} ${r.row.name.split(" ")[0].toLowerCase()}`
      )
      .join(" and ")

  const worse = quality("worse")
  const better = quality("better")
  const costs = moves("worse")
  const gains = moves("better")
  if (worse) return `NO: worse ${worse}.`
  if (better && costs) {
    return `MAYBE: better ${better}, but ${costs}. Worth it if that trade is.`
  }
  if (better) return `YES: better ${better}${gains ? `, and ${gains}` : ""}.`
  const same = judged ? "Same quality" : "No judge, so quality is unknown"
  if (costs) return `NO: ${same}, but ${costs}.`
  if (gains) return `YES: ${same}, and ${gains}.`
  return "NO: no real difference, so no reason to switch."
}

/** Cases whose usefulness dropped the most, worst first. */
function biggestDrops(
  runs: ScoredRun[],
  baseline: string,
  candidate: string,
  limit = 5
): string[] {
  const a = perCaseMeans(runs, baseline, "judge_useful")
  const b = perCaseMeans(runs, candidate, "judge_useful")
  return [...a]
    .filter(([caseID]) => b.has(caseID))
    .map(([caseID, before]) => ({ caseID, before, after: b.get(caseID)! }))
    .filter(({ before, after }) => after < before)
    .sort((x, y) => x.after - x.before - (y.after - y.before))
    .slice(0, limit)
    .map(
      ({ caseID, before, after }) =>
        `${caseID} (${before.toFixed(1)} → ${after.toFixed(1)})`
    )
}

const pad = (text: string, width: number) => text.padEnd(width)

export function summarize(
  runs: ScoredRun[],
  labels: string[],
  repetitions: number
): string {
  const [baseline, ...candidates] = labels
  const judged = runs.some((run) => run.scores.judge_useful != null)
  const lines: string[] = []

  for (const candidate of candidates) {
    const rows = ROWS.map((row) =>
      compare(runs, baseline, candidate, row)
    ).filter((r): r is Compared => r !== null)
    const cases = new Set(
      runs.filter((r) => r.variant === candidate).map((r) => r.caseID)
    ).size

    // Failed runs have no scores, so the table silently rests on the rest;
    // too many and the comparison isn't the one asked for.
    const failures = [baseline, candidate].map((label) => {
      const own = runs.filter((r) => r.variant === label)
      const count = (kind: ScoredRun["failed"]) =>
        own.filter((r) => r.failed === kind).length
      return {
        label,
        total: own.length,
        run: count("run"),
        judge: count("judge"),
      }
    })
    const tooFew = cases < MIN_CASES
    const tooMany = failures.find(
      (f) => f.total === 0 || (f.run + f.judge) / f.total > MAX_FAILED
    )

    lines.push(
      "",
      `${candidate} vs ${baseline} · ${cases} cases × ${repetitions} run${
        repetitions === 1 ? "" : "s"
      }`,
      "",
      `Switch? ${
        tooFew
          ? `NO VERDICT: only ${cases} cases; the intervals need at least ${MIN_CASES}.`
          : tooMany
          ? `NO VERDICT: ${tooMany.run + tooMany.judge} of ${tooMany.total} ${
              tooMany.label
            } runs failed. Fix the errors in runs.jsonl and rerun.`
          : verdict(rows, judged)
      }`
    )
    if (failures.some((f) => f.run || f.judge)) {
      lines.push(
        "Failed: " +
          failures
            .map(
              (f) =>
                `${f.label} ${f.run} turns, ${f.judge} judge calls of ${f.total}`
            )
            .join("; ")
      )
    }

    const widths = [22, Math.max(10, baseline.length + 2), 12]
    lines.push(
      "",
      pad("", widths[0]) + pad(baseline, widths[1]) + pad(candidate, widths[2])
    )
    for (const r of rows) {
      const note =
        r.change === "same"
          ? "same"
          : r.row.quality
          ? r.change
          : `${r.change} ${signed(r.percent)}`
      lines.push(
        pad(r.row.name, widths[0]) +
          pad(r.row.format(r.baseline), widths[1]) +
          pad(r.row.format(r.candidate), widths[2]) +
          note
      )
    }

    // Unknown, not $0, when the model isn't in the price table.
    const total = (label: string) => {
      const costs = runs
        .filter((r) => r.variant === label && r.scores.cost_usd != null)
        .map((r) => r.scores.cost_usd as number)
      return costs.length ? `$${sumBy(costs).toFixed(2)}` : "unknown"
    }
    lines.push(
      "",
      `Run cost: ${baseline} ${total(baseline)}, ` +
        `${candidate} ${total(candidate)} (assistant only)`
    )

    const drops = biggestDrops(runs, baseline, candidate)
    if (drops.length) {
      lines.push(`Biggest drops in usefulness: ${drops.join(", ")}`)
    }
  }

  lines.push(
    "",
    "“same” means the difference is within noise. Open the drops in Phoenix's compare view to see why."
  )
  return lines.join("\n")
}
