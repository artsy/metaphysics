/**
 * Summaries for the terminal. Repetitions of a case are averaged first, so
 * each case counts once and a noisy case can't outvote a stable one.
 */

import { mean } from "lodash"

export interface ScoredRun {
  variant: string
  caseID: string
  scores: Record<string, number | null>
  /** The turn errored (no scores), or only the judge did (no judge_* scores). */
  failed?: "run" | "judge"
}

export function perCaseMeans(
  runs: ScoredRun[],
  variant: string,
  metric: string
): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>()
  for (const run of runs) {
    if (run.variant !== variant) continue
    const value = run.scores[metric]
    if (value === null || value === undefined) continue
    const entry = sums.get(run.caseID) ?? { total: 0, count: 0 }
    entry.total += value
    entry.count += 1
    sums.set(run.caseID, entry)
  }
  return new Map(
    [...sums].map(([caseID, { total, count }]) => [caseID, total / count])
  )
}

const percentile = (values: number[], p: number) => {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

const RESAMPLES = 2000

/** A seeded PRNG, so the same results always print the same interval. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface PairedComparison {
  cases: number
  baseline: number
  candidate: number
  diff: number
  ciLow: number
  ciHigh: number
}

/**
 * Candidate minus baseline over the cases both scored, with a 95% bootstrap
 * interval over cases. An interval that excludes 0 is a real difference at
 * this sample size; one that straddles it is not, whatever the means say.
 */
export function pairedComparison(
  runs: ScoredRun[],
  baseline: string,
  candidate: string,
  metric: string
): PairedComparison | null {
  const a = perCaseMeans(runs, baseline, metric)
  const b = perCaseMeans(runs, candidate, metric)
  const shared = [...a.keys()].filter((caseID) => b.has(caseID))
  if (shared.length === 0) return null

  const diffs = shared.map((caseID) => b.get(caseID)! - a.get(caseID)!)
  const random = mulberry32(42)
  const boots: number[] = []
  for (let i = 0; i < RESAMPLES; i++) {
    let total = 0
    for (let j = 0; j < diffs.length; j++) {
      total += diffs[Math.floor(random() * diffs.length)]
    }
    boots.push(total / diffs.length)
  }

  return {
    cases: shared.length,
    baseline: mean(shared.map((caseID) => a.get(caseID)!)),
    candidate: mean(shared.map((caseID) => b.get(caseID)!)),
    diff: mean(diffs),
    ciLow: percentile(boots, 0.025),
    ciHigh: percentile(boots, 0.975),
  }
}
