import {
  answered,
  constraintFilters,
  costUSD,
  expectedSection,
  failedSearches,
  runCodeEvaluators,
  tokens,
  toolArgsPresent,
} from "../evaluators"
import type { EvalCase, EvalRunOutput, EvalToolCall } from "../types"

const call = (overrides: Partial<EvalToolCall> = {}): EvalToolCall => ({
  query: "{ artworksConnection(first: 10) { edges { node { internalID } } } }",
  variables: null,
  ok: true,
  result: "{}",
  ...overrides,
})

const output = (overrides: Partial<EvalRunOutput> = {}): EvalRunOutput => ({
  message: "Here are some paintings.",
  stopReason: "stop",
  sectionType: "ARTWORKS",
  cards: [{ internalID: "a1" }],
  suggestedReplies: [],
  steps: [
    {
      durationMs: 1000,
      finishReason: "tool-calls",
      modelId: "claude-sonnet-5",
      inputTokens: 100,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 10,
      toolCalls: [call()],
    },
  ],
  latencyMs: 12_345,
  costUSD: 0.0123,
  ...overrides,
})

const testCase = (overrides: Partial<EvalCase> = {}): EvalCase => ({
  id: "gs-1",
  input: { message: "Paintings under $5,000" },
  reference: {},
  metadata: {},
  ...overrides,
})

const withSearch = (query: string, variables: unknown = null) =>
  output({
    steps: [{ ...output().steps[0], toolCalls: [call({ query, variables })] }],
  })

describe("answered", () => {
  it("passes a finished answer and fails anything else", () => {
    expect(answered(output()).score).toBe(1)
    expect(answered(output({ stopReason: "max_iterations" })).score).toBe(0)
    expect(answered(output({ message: "  " })).score).toBe(0)
    expect(answered(output({ message: null, stopReason: "error" }))).toEqual(
      expect.objectContaining({ score: 0, explanation: "stopReason=error" })
    )
  })
})

describe("toolArgsPresent", () => {
  it("is not applicable without tool calls", () => {
    expect(toolArgsPresent(output({ steps: [] })).score).toBeNull()
  })

  it("fails a call with no query, the {} bug", () => {
    const result = toolArgsPresent(
      output({
        steps: [
          { ...output().steps[0], toolCalls: [call(), call({ query: null })] },
        ],
      })
    )
    expect(result.score).toBe(0)
    expect(result.explanation).toBe("1 of 2 calls had no query")
  })
})

describe("failedSearches", () => {
  it("counts failed calls and quotes them", () => {
    const result = failedSearches(
      output({
        steps: [
          {
            ...output().steps[0],
            toolCalls: [
              call({ ok: false, result: "Upstream service error" }),
              call(),
            ],
          },
        ],
      })
    )
    expect(result.score).toBe(1)
    expect(result.explanation).toContain("Upstream service error")
  })
})

describe("expectedSection", () => {
  it("is not applicable when the case doesn't care", () => {
    expect(expectedSection(output(), testCase()).score).toBeNull()
    expect(
      expectedSection(
        output(),
        testCase({ reference: { expectedSection: "ANY" } })
      ).score
    ).toBeNull()
  })

  it("compares the section type, treating no section as NONE", () => {
    const artworks = testCase({ reference: { expectedSection: "ARTWORKS" } })
    const none = testCase({ reference: { expectedSection: "NONE" } })
    expect(expectedSection(output(), artworks).score).toBe(1)
    expect(expectedSection(output({ sectionType: null }), none).score).toBe(1)
    expect(expectedSection(output(), none).score).toBe(0)
  })
})

describe("constraintFilters", () => {
  const budget = (priceMaxUSD: number) =>
    testCase({ metadata: { constraints: { priceMaxUSD } } })

  it("finds a priceRange inline or in variables", () => {
    expect(
      constraintFilters(
        withSearch('{ artworksConnection(priceRange: "*-5000") { edges } }'),
        budget(5000)
      ).score
    ).toBe(1)
    expect(
      constraintFilters(
        withSearch(
          "query($p: String) { artworksConnection(priceRange: $p) { edges } }",
          { p: "1000-5000" }
        ),
        budget(5000)
      ).score
    ).toBe(1)
  })

  it("fails a ceiling above the budget or a missing one", () => {
    expect(
      constraintFilters(
        withSearch('{ artworksConnection(priceRange: "*-20000") { edges } }'),
        budget(5000)
      ).score
    ).toBe(0)
    expect(
      constraintFilters(
        withSearch('{ artworksConnection(priceRange: "5000-*") { edges } }'),
        budget(5000)
      ).score
    ).toBe(0)
  })

  it("scores the share of stated constraints the searches carried", () => {
    const result = constraintFilters(
      withSearch(
        '{ artworksConnection(priceRange: "*-5000", forSale: true) { edges } }'
      ),
      testCase({
        metadata: {
          constraints: { priceMaxUSD: 5000, forSale: true, medium: "painting" },
        },
      })
    )
    expect(result.score).toBeCloseTo(2 / 3)
    expect(result.explanation).toContain("✗ medium (painting)")
  })

  it("counts a medium filter, not a selected medium field", () => {
    const painting = testCase({
      metadata: { constraints: { medium: "painting" } },
    })
    expect(
      constraintFilters(
        withSearch(
          "{ artworksConnection(first: 5) { edges { node { medium } } } }"
        ),
        painting
      ).score
    ).toBe(0)
    expect(
      constraintFilters(
        withSearch(
          'query($g: [String]) { artist(id: "x") { filterArtworksConnection(additionalGeneIDs: $g) { edges } } }',
          { g: ["painting"] }
        ),
        painting
      ).score
    ).toBe(1)
  })

  it("ignores searches that aren't artwork searches", () => {
    expect(
      constraintFilters(
        withSearch('{ artist(id: "banksy") { name } }'),
        budget(5000)
      ).score
    ).toBeNull()
  })

  it("fails a turn that never searched when artworks were expected", () => {
    const result = constraintFilters(
      output({ steps: [] }),
      testCase({
        reference: { expectedSection: "ARTWORKS" },
        metadata: { constraints: { priceMaxUSD: 5000 } },
      })
    )
    expect(result.score).toBe(0)
  })

  it("is not applicable when nothing was stated", () => {
    expect(constraintFilters(output(), testCase()).score).toBeNull()
  })
})

describe("costUSD", () => {
  it("reports null rather than a guess for an unpriced model", () => {
    expect(costUSD(output({ costUSD: null })).score).toBeNull()
  })
})

describe("tokens", () => {
  it("sums every step; input includes cache reads", () => {
    const step = output().steps[0]
    const run = output({
      steps: [
        { ...step, inputTokens: 1000, cacheReadTokens: 800, outputTokens: 50 },
        { ...step, inputTokens: 1500, cacheReadTokens: 900, outputTokens: 200 },
      ],
    })
    expect(
      Object.fromEntries(tokens(run).map((s) => [s.name, s.score]))
    ).toEqual({
      input_tokens: 2500,
      cache_read_tokens: 1700,
      output_tokens: 250,
      total_tokens: 2750,
    })
    expect(
      runCodeEvaluators(run, testCase()).filter((s) =>
        s.name.endsWith("_tokens")
      )
    ).toHaveLength(4)
  })
})

describe("runCodeEvaluators", () => {
  it("returns one score per evaluator, with unique names", () => {
    const names = runCodeEvaluators(output(), testCase()).map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(
      expect.arrayContaining(["answered", "steps", "latency_s", "cost_usd"])
    )
  })
})
