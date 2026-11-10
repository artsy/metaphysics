import { summarize } from "../report"
import type { ScoredRun } from "../stats"

const runs = (
  variant: string,
  scores: (i: number) => Record<string, number>
): ScoredRun[] =>
  Array.from({ length: 30 }, (_, i) => ({
    variant,
    caseID: `c${i}`,
    scores: scores(i),
  }))

const base = (i: number) => ({
  answered: 1,
  judge_useful: 3 + (i % 2),
  latency_s: 10 + (i % 3),
  cost_usd: 0.03,
  total_tokens: 40000,
})

describe("summarize", () => {
  it("says no when quality drops", () => {
    const report = summarize(
      [
        ...runs("a", base),
        ...runs("b", (i) => ({ ...base(i), judge_useful: 2 })),
      ],
      ["a", "b"],
      3
    )
    expect(report).toContain("Switch? NO: worse useful (1–5).")
    expect(report).toContain("Biggest drops in usefulness:")
  })

  it("says yes when quality holds and cost falls", () => {
    const report = summarize(
      [
        ...runs("a", base),
        ...runs("b", (i) => ({ ...base(i), cost_usd: 0.02 + (i % 2) * 0.001 })),
      ],
      ["a", "b"],
      3
    )
    expect(report).toMatch(/Switch\? YES: Same quality, and −\d+% cost\./)
    expect(report).toMatch(
      /Cost per answer\s+\$0\.030\s+\$0\.021\s+better −\d+%/
    )
  })

  it("weighs better quality against higher latency", () => {
    const report = summarize(
      [
        ...runs("a", base),
        ...runs("b", (i) => ({
          ...base(i),
          judge_useful: 5,
          latency_s: 20 + (i % 3),
        })),
      ],
      ["a", "b"],
      3
    )
    expect(report).toMatch(
      /Switch\? MAYBE: better useful \(1–5\), but \+\d+% latency/
    )
  })

  it("gives no verdict on a small run", () => {
    const report = summarize(
      [
        { variant: "a", caseID: "x", scores: { answered: 1, cost_usd: 0.01 } },
        { variant: "b", caseID: "x", scores: { answered: 1, cost_usd: 0.01 } },
      ],
      ["a", "b"],
      1
    )
    expect(report).toContain(
      "Switch? NO VERDICT: only 1 cases; the intervals need at least 20."
    )
  })

  it("withholds the verdict when too many runs failed", () => {
    const report = summarize(
      [
        ...runs("a", base),
        ...runs("b", base).map((run, i) =>
          i < 5 ? { ...run, scores: {}, failed: "run" as const } : run
        ),
      ],
      ["a", "b"],
      3
    )
    expect(report).toContain("Switch? NO VERDICT: 5 of 30 b runs failed.")
    expect(report).toContain(
      "Failed: a 0 turns, 0 judge calls of 30; b 5 turns, 0 judge calls of 30"
    )
  })

  it("prints an unknown cost rather than $0", () => {
    const report = summarize(
      [
        ...runs("a", base),
        ...runs("b", (i) => ({ ...base(i), cost_usd: null as any })),
      ],
      ["a", "b"],
      3
    )
    expect(report).toContain("Run cost: a $0.90, b unknown")
  })
})
