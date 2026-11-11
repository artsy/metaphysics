import { mkdtempSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { readDatasetFile } from "../dataset"
import { buildJudgePrompt, verdictScores } from "../judge"
import { loadPrices, parseVariant, priceFor, stepCostUSD } from "../models"
import { PhoenixClient } from "../phoenix"
import { pairedComparison, perCaseMeans } from "../stats"
import type { ScoredRun } from "../stats"

jest.mock("lib/apis/anthropic", () => ({
  anthropicProvider: () => jest.fn(),
  litellmProvider: () => jest.fn(),
}))

describe("parseVariant", () => {
  it("reads label, provider, model and an optional prompt file", () => {
    expect(parseVariant("base=anthropic:claude-sonnet-5")).toEqual({
      label: "base",
      provider: "anthropic",
      model: "claude-sonnet-5",
    })
    expect(
      parseVariant("next=litellm:art-assistant-candidate@prompts/v2.md")
    ).toEqual({
      label: "next",
      provider: "litellm",
      model: "art-assistant-candidate",
      promptFile: "prompts/v2.md",
    })
  })

  it("rejects anything else", () => {
    expect(() => parseVariant("claude-sonnet-5")).toThrow(/Bad --variant/)
    expect(() => parseVariant("x=openai:gpt")).toThrow(/Bad --variant/)
  })
})

describe("cost", () => {
  // Shaped like LiteLLM's /model/info response.
  const modelInfo = {
    data: [
      {
        model_name: "claude-sonnet-5",
        litellm_params: { model: "anthropic/claude-sonnet-5" },
        model_info: {
          input_cost_per_token: 2e-6,
          output_cost_per_token: 1e-5,
          cache_read_input_token_cost: 2e-7,
          cache_creation_input_token_cost: 2.5e-6,
        },
      },
      {
        model_name: "art-assistant",
        litellm_params: { model: "anthropic/claude-sonnet-5-5" },
        model_info: {
          input_cost_per_token: 2e-6,
          output_cost_per_token: 1e-5,
        },
      },
      { model_name: "unpriced", model_info: {} },
    ],
  }
  beforeAll(() => loadPrices(async () => modelInfo))

  it("matches public, upstream and dated model IDs", () => {
    expect(priceFor("claude-sonnet-5")).not.toBeNull()
    expect(priceFor("anthropic/claude-sonnet-5-20260901")).toBe(
      priceFor("claude-sonnet-5")
    )
    expect(priceFor("art-assistant")).toBe(priceFor("claude-sonnet-5-5"))
    expect(priceFor("unpriced")).toBeNull()
    expect(priceFor("claude-sonnet-5-6")).toBeNull()
  })

  it("bills cached input at its own rates", () => {
    // 1M input of which 600k cache reads and 100k writes, plus 100k output:
    // 300k × $2 + 600k × $0.20 + 100k × $2.50 + 100k × $10, per million.
    expect(
      stepCostUSD({
        modelId: "claude-sonnet-5",
        inputTokens: 1_000_000,
        cacheReadTokens: 600_000,
        cacheWriteTokens: 100_000,
        outputTokens: 100_000,
      })
    ).toBeCloseTo(0.6 + 0.12 + 0.25 + 1.0)
  })

  it("is unknown when a cache rate the step used isn't listed", () => {
    const step = {
      modelId: "art-assistant",
      inputTokens: 1000,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 100,
    }
    expect(stepCostUSD(step)).toBeCloseTo(0.002 + 0.001)
    expect(stepCostUSD({ ...step, cacheReadTokens: 500 })).toBeNull()
  })
})

describe("stats", () => {
  const runs: ScoredRun[] = [
    // Case a: the candidate is better on average over two repetitions.
    { variant: "base", caseID: "a", scores: { useful: 3 } },
    { variant: "base", caseID: "a", scores: { useful: 3 } },
    { variant: "next", caseID: "a", scores: { useful: 4 } },
    { variant: "next", caseID: "a", scores: { useful: 5 } },
    // Case b: a tie. Case c: only the baseline scored it.
    { variant: "base", caseID: "b", scores: { useful: 4 } },
    { variant: "next", caseID: "b", scores: { useful: 4 } },
    { variant: "base", caseID: "c", scores: { useful: 1 } },
    { variant: "next", caseID: "c", scores: { useful: null } },
  ]

  it("averages repetitions per case and skips nulls", () => {
    expect(perCaseMeans(runs, "next", "useful")).toEqual(
      new Map([
        ["a", 4.5],
        ["b", 4],
      ])
    )
  })

  it("compares only the cases both variants scored", () => {
    const comparison = pairedComparison(runs, "base", "next", "useful")!
    expect(comparison).toEqual(
      expect.objectContaining({
        cases: 2,
        baseline: 3.5,
        candidate: 4.25,
        diff: 0.75,
      })
    )
    expect(comparison.ciLow).toBeLessThanOrEqual(comparison.diff)
    expect(comparison.ciHigh).toBeGreaterThanOrEqual(comparison.diff)
    // Deterministic: the same runs always print the same interval.
    expect(pairedComparison(runs, "base", "next", "useful")).toEqual(comparison)
  })
})

describe("readDatasetFile", () => {
  const write = (content: string) => {
    const path = join(mkdtempSync(join(tmpdir(), "evals-")), "set.jsonl")
    writeFileSync(path, content)
    return path
  }

  it("maps output to the reference and caseId to the id", () => {
    const path = write(
      [
        JSON.stringify({
          input: { message: "Hi" },
          output: { expectedSection: "NONE" },
          metadata: { caseId: "gs-001" },
        }),
        "",
        JSON.stringify({ input: { message: "Yo" } }),
      ].join("\n")
    )
    expect(readDatasetFile(path)).toEqual([
      {
        id: "gs-001",
        input: { message: "Hi" },
        reference: { expectedSection: "NONE" },
        metadata: { caseId: "gs-001" },
      },
      { id: "line-3", input: { message: "Yo" }, reference: {}, metadata: {} },
    ])
  })

  it("names the line of a bad record", () => {
    expect(() => readDatasetFile(write('{"input": {}}'))).toThrow(/:1: input/)
  })
})

describe("judge", () => {
  it("shows the judge the case, the searches and the cards", () => {
    const prompt = buildJudgePrompt(
      {
        id: "gs-1",
        input: {
          message: "Cheaper ones?",
          history: [{ role: "USER", content: "Paintings by Hockney" }],
        },
        reference: {
          expectedBehavior: "Shows cheaper Hockney works",
          mustNot: ["show prints"],
        },
        metadata: {},
      },
      {
        message: "Here are some.",
        stopReason: "stop",
        sectionType: "ARTWORKS",
        cards: [
          {
            internalID: "a1",
            title: "Pool",
            artist: "David Hockney",
            price: "$4,000",
          },
        ],
        suggestedReplies: [],
        steps: [
          {
            durationMs: 1,
            finishReason: "tool-calls",
            modelId: null,
            inputTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            outputTokens: 0,
            toolCalls: [
              { query: "{ q }", variables: null, ok: false, result: "boom" },
            ],
          },
        ],
        latencyMs: 1,
        costUSD: null,
      }
    )
    expect(prompt).toContain("USER: Paintings by Hockney")
    expect(prompt).toContain("Shows cheaper Hockney works")
    expect(prompt).toContain("<must_not>\nshow prints")
    expect(prompt).toContain("#1 FAILED")
    expect(prompt).toContain("1. Pool by David Hockney — $4,000")
  })

  it("leaves not-applicable judgments out of the averages", () => {
    const scores = verdictScores({
      explanation: "Fine.",
      useful: 4,
      constraints: "na",
      grounded: "fail",
    })
    expect(scores.map((s) => [s.name, s.score])).toEqual([
      ["judge_useful", 4],
      ["judge_constraints", null],
      ["judge_grounded", 0],
    ])
  })
})

describe("PhoenixClient", () => {
  const fetchMock = jest.fn()
  const realFetch = global.fetch
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as any
  })
  afterAll(() => {
    global.fetch = realFetch
  })

  const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValueOnce({
      ok: status < 400,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })

  const client = new PhoenixClient({
    url: "https://phoenix.test",
    apiKey: "key",
  })

  it("uploads a dataset with one split per category", async () => {
    respond({
      data: {
        dataset_id: "d1",
        version_id: "v1",
        num_created_examples: 1,
        num_updated_examples: 0,
        num_deleted_examples: 0,
      },
    })
    await client.uploadDataset({
      name: "golden",
      cases: [
        {
          input: { message: "Hi" },
          reference: { expectedSection: "NONE" },
          metadata: { category: "out_of_scope" },
        },
      ],
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      "https://phoenix.test/v1/datasets/upload?sync=true"
    )
    expect(init.headers.authorization).toBe("Bearer key")
    expect(JSON.parse(init.body)).toEqual({
      action: "create",
      name: "golden",
      inputs: [{ message: "Hi" }],
      outputs: [{ expectedSection: "NONE" }],
      metadata: [{ category: "out_of_scope" }],
      splits: ["out_of_scope"],
    })
  })

  it("posts runs and evaluations in Phoenix's shapes", async () => {
    respond({ data: { id: "run-1" } })
    respond({ data: { id: "eval-1" } })
    const start = new Date("2026-11-09T10:00:00Z")
    const end = new Date("2026-11-09T10:00:05Z")

    await client.createRun("exp-1", {
      exampleID: "ex-1",
      repetition: 2,
      output: { message: "Hi" },
      startTime: start,
      endTime: end,
    })
    await client.createEvaluation(
      "run-1",
      { name: "answered", kind: "CODE", score: 1, label: "yes" },
      { startTime: start, endTime: end }
    )

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://phoenix.test/v1/experiments/exp-1/runs"
    )
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      dataset_example_id: "ex-1",
      repetition_number: 2,
      output: { message: "Hi" },
      start_time: "2026-11-09T10:00:00.000Z",
      end_time: "2026-11-09T10:00:05.000Z",
      error: null,
    })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      experiment_run_id: "run-1",
      name: "answered",
      annotator_kind: "CODE",
      start_time: "2026-11-09T10:00:00.000Z",
      end_time: "2026-11-09T10:00:05.000Z",
      result: { score: 1, label: "yes", explanation: null },
    })
  })

  it("says which call failed", async () => {
    respond({ detail: "nope" }, 404)
    await expect(client.datasetByName("missing")).rejects.toThrow(
      /GET \/v1\/datasets\?name=missing: HTTP 404/
    )
  })
})
