import { GraphQLSchema } from "graphql"
import { MockLanguageModelV3, convertArrayToReadableStream } from "ai/test"
import type { LanguageModelV3StreamResult } from "@ai-sdk/provider"
import config from "config"
import { ResolverContext } from "types/graphql"

// Mock the Anthropic provider factory so `runTurn` gets a MockLanguageModelV3
// instead of hitting the network. `anthropicProvider()` normally returns a
// `(modelId) => LanguageModelV3` function; here it always returns whatever
// model the current test installed via `mockModel`.
let mockModel: MockLanguageModelV3
jest.mock("lib/apis/anthropic", () => ({
  anthropicProvider: () => () => mockModel,
}))

// Running a model-authored query against the real narrowed schema (parsing,
// validating, executing) is covered by tools.test.ts; here we only need a
// controllable execute() result for the single "query_artsy" tool. Mocking
// `runQueryArtsyTool` directly doesn't work — `buildAgentTools`'s `execute`
// calls it as an internal, same-module reference, which `jest.requireActual`
// doesn't intercept — so this replaces `buildAgentTools` itself instead,
// keeping `summarizeToolCall` real (it's pure and worth exercising for real)
// while swapping in a controllable execute.
const mockToolExecute = jest.fn().mockResolvedValue({
  ok: true,
  content: '{"artist":{"name":"Andy Warhol"}}',
})
jest.mock("../tools", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { tool, jsonSchema } = require("ai")
  const actual = jest.requireActual("../tools")
  return {
    ...actual,
    buildAgentTools: () => ({
      query_artsy: tool({
        description: "test",
        inputSchema: jsonSchema({ type: "object" }),
        execute: (input: unknown) => mockToolExecute(input),
      }),
    }),
  }
})

// Per-user rate limiting is unit-tested in lib/__tests__/rateLimitByUser.test.ts;
// here we only need to control its verdict. Note the real limiter degrades open
// under the test memcached mock (which has no `incr`/`add`), so without this the
// other tests in this file would be unaffected anyway.
const mockRateLimitByUser = jest.fn()
jest.mock("lib/rateLimitByUser", () => ({
  rateLimitByUser: (...args: any[]) => mockRateLimitByUser(...args),
}))

import { runTurn } from "../runTurn"

const FAKE_USAGE = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
  totalTokens: 20,
}

// MockLanguageModelV3's array form of `doStream` (installed ai@6.0.258) has
// an off-by-one: it pushes onto `doStreamCalls` *before* indexing into the
// array (`doStream[this.doStreamCalls.length]`), so the Nth call reads
// index N, not N-1 — array[0] is never reachable. Duplicating the first step
// into the unused slot 0 keeps the rest of the array at its natural,
// readable 1:1 mapping to "step 1, step 2, ...".
function stepsWithOffset<T>(steps: T[]): T[] {
  return [steps[0], ...steps]
}

function fakeContext(
  overrides: { artworksLoader?: jest.Mock } = {}
): ResolverContext {
  return ({
    userID: "user-42",
    accessToken: "token",
    aiPromptTemplatesLoader: jest.fn().mockResolvedValue({ body: [] }),
    artworksLoader: overrides.artworksLoader ?? jest.fn().mockResolvedValue([]),
  } as unknown) as ResolverContext
}

async function collectEvents(
  input: { conversationID: string; message: string },
  context: ResolverContext = fakeContext()
) {
  const events: any[] = []
  for await (const event of runTurn(
    input,
    ({} as unknown) as GraphQLSchema,
    context
  )) {
    events.push(event)
  }
  return events
}

describe("runTurn", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRateLimitByUser.mockResolvedValue({ allowed: true, count: 1 })
  })

  it("maps a two-step turn (tool-call step, then a final structured-output step) to AIAgentEvents", async () => {
    // Each element of `doStream` is one API round trip ("step"); a
    // finishReason of "tool-calls" doesn't end the loop — the AI SDK runs
    // the tool's `execute` and calls the model again automatically. The
    // final step's text is JSON matching AgentOutputSchema (not prose) —
    // that's how structured output actually renders on the wire; runTurn
    // reconstructs incremental prose deltas from it (see the next test).
    // The model supplies only `artworkIDs`; runTurn resolves them to real
    // Artwork nodes via artworksLoader, so the payload's `artworks` reflects
    // whatever the loader returns, not what the model claimed.
    const finalJson = JSON.stringify({
      message: "Found Andy Warhol.",
      artworkIDs: ["andy-warhol-flowers"],
    })
    const artworksLoader = jest
      .fn()
      .mockResolvedValue([
        { _id: "abc123", id: "andy-warhol-flowers", title: "Flowers" },
      ])
    mockModel = new MockLanguageModelV3({
      doStream: stepsWithOffset([
        {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
            {
              type: "tool-call",
              toolCallId: "call-1",
              toolName: "query_artsy",
              input: JSON.stringify({
                query:
                  '{ artistsConnection(term: "Warhol", first: 5) { edges { node { name } } } }',
              }),
            },
            {
              type: "finish",
              finishReason: { unified: "tool-calls", raw: "tool_use" },
              usage: FAKE_USAGE,
            },
          ]),
        },
        {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "2" },
            { type: "text-delta", id: "2", delta: finalJson },
            { type: "text-end", id: "2" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: "end_turn" },
              usage: FAKE_USAGE,
            },
          ]),
        },
      ]),
    })

    const events = await collectEvents(
      { conversationID: "c1", message: "Find Warhol" },
      fakeContext({ artworksLoader })
    )

    expect(events.map((e) => e.__typename)).toEqual([
      "AIAgentToolCall",
      "AIAgentToolResult",
      "AIAgentTextDelta",
      "AIAgentTurnComplete",
    ])
    expect(events[0]).toMatchObject({ toolName: "query_artsy" })
    expect(events[1]).toMatchObject({ toolName: "query_artsy", ok: true })
    expect(events[2]).toMatchObject({ text: "Found Andy Warhol." })
    expect(events[3]).toMatchObject({
      stopReason: "stop",
      toolCallCount: 1,
      message: "Found Andy Warhol.",
      artworks: [
        { _id: "abc123", id: "andy-warhol-flowers", title: "Flowers" },
      ],
    })
    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["andy-warhol-flowers"],
    })
    expect(mockModel.doStreamCalls).toHaveLength(2)
  })

  it("reconstructs incremental prose deltas from chunked structured-output JSON", async () => {
    // Real streaming delivers the final JSON in many small text-delta
    // chunks, not one shot — split mid-field-name and mid-string-value to
    // exercise `parsePartialJson`'s partial-buffer handling for real.
    const chunks = ['{"mess', 'age":"Hello ', "there", '!","artworkIDs":[]}']
    mockModel = new MockLanguageModelV3({
      doStream: {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "1" },
          ...chunks.map((delta) => ({
            type: "text-delta" as const,
            id: "1",
            delta,
          })),
          { type: "text-end", id: "1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "end_turn" },
            usage: FAKE_USAGE,
          },
        ]),
      },
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Hi",
    })

    const deltas = events.filter((e) => e.__typename === "AIAgentTextDelta")
    expect(deltas.map((d) => d.text).join("")).toBe("Hello there!")
    const complete = events.find((e) => e.__typename === "AIAgentTurnComplete")
    expect(complete).toMatchObject({ message: "Hello there!", artworks: [] })
  })

  it("emits no text-delta for a chunk that never resolves to parseable JSON", async () => {
    // Defensive case: if a step's text isn't valid/partial JSON at all (e.g.
    // stray non-JSON content), parsePartialJson fails and nothing is yielded
    // — this must never throw.
    mockModel = new MockLanguageModelV3({
      doStream: {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "1" },
          { type: "text-delta", id: "1", delta: "not json at all" },
          { type: "text-end", id: "1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "end_turn" },
            usage: FAKE_USAGE,
          },
        ]),
      },
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Hi",
    })

    expect(events.map((e) => e.__typename)).toEqual(["AIAgentTurnComplete"])
    expect(events[0]).toMatchObject({ message: null, artworks: null })
  })

  it("does not throw when a tool result is an error — surfaces as ok:false", async () => {
    mockToolExecute.mockResolvedValueOnce({
      ok: false,
      content: "This query must contain the total aggregation",
    })

    mockModel = new MockLanguageModelV3({
      doStream: stepsWithOffset([
        {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
            {
              type: "tool-call",
              toolCallId: "call-1",
              toolName: "query_artsy",
              input: JSON.stringify({
                query:
                  "{ artworksConnection(first: 5) { edges { node { title } } } }",
              }),
            },
            {
              type: "finish",
              finishReason: { unified: "tool-calls", raw: "tool_use" },
              usage: FAKE_USAGE,
            },
          ]),
        },
        {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "1" },
            {
              type: "text-delta",
              id: "1",
              delta: JSON.stringify({
                message: "I couldn't complete that search.",
                artworkIDs: [],
              }),
            },
            { type: "text-end", id: "1" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: "end_turn" },
              usage: FAKE_USAGE,
            },
          ]),
        },
      ]),
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Find artworks",
    })

    const toolResult = events.find((e) => e.__typename === "AIAgentToolResult")
    expect(toolResult).toMatchObject({ ok: false })

    const complete = events.find((e) => e.__typename === "AIAgentTurnComplete")
    expect(complete).toMatchObject({ stopReason: "stop" })
    expect(mockModel.doStreamCalls).toHaveLength(2)
  })

  it("terminates with a non-throwing AIAgentTurnComplete when the stream itself errors", async () => {
    mockModel = new MockLanguageModelV3({
      doStream: {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "error", error: new Error("network error") },
        ]),
      },
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Anything",
    })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      __typename: "AIAgentTurnComplete",
      stopReason: "error",
      message: null,
    })
  })

  it("terminates cleanly with a text-only turn (no tool calls)", async () => {
    mockModel = new MockLanguageModelV3({
      doStream: {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "1" },
          {
            type: "text-delta",
            id: "1",
            delta: JSON.stringify({ message: "Hello!", artworkIDs: [] }),
          },
          { type: "text-end", id: "1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "end_turn" },
            usage: FAKE_USAGE,
          },
        ]),
      },
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Hi",
    })

    expect(events.map((e) => e.__typename)).toEqual([
      "AIAgentTextDelta",
      "AIAgentTurnComplete",
    ])
    expect(events[1]).toMatchObject({
      stopReason: "stop",
      toolCallCount: 0,
      message: "Hello!",
      artworks: [],
    })
  })

  it("reports max_iterations when the step cap is hit while the model still wants to call tools", async () => {
    // Every step keeps calling a tool, so the loop never reaches a natural
    // "stop" — it only ends because `stopWhen: stepCountIs(N)` truncates it,
    // leaving finishReason at "tool-calls". Each array entry needs its own
    // ReadableStream (they're single-consumption), and — see
    // `stepsWithOffset` — index 0 is never read, so this needs N+1 entries
    // to cover N calls.
    const buildStep = (): LanguageModelV3StreamResult => ({
      stream: convertArrayToReadableStream([
        { type: "stream-start", warnings: [] },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "query_artsy",
          input: JSON.stringify({
            query:
              '{ artistsConnection(term: "Warhol", first: 5) { edges { node { name } } } }',
          }),
        },
        {
          type: "finish",
          finishReason: { unified: "tool-calls", raw: "tool_use" },
          usage: FAKE_USAGE,
        },
      ]),
    })
    mockModel = new MockLanguageModelV3({
      doStream: Array.from(
        { length: config.AI_AGENT_MAX_ITERATIONS + 1 },
        buildStep
      ),
    })

    const events = await collectEvents({
      conversationID: "c1",
      message: "Find Warhol",
    })

    const complete = events.find((e) => e.__typename === "AIAgentTurnComplete")
    expect(complete).toMatchObject({
      stopReason: "max_iterations",
      message: null,
    })
    expect(mockModel.doStreamCalls).toHaveLength(config.AI_AGENT_MAX_ITERATIONS)
  })

  it("aborts the in-flight request when the consumer disconnects early", async () => {
    // Simulates Yoga's SSE plumbing calling `.return()` on the subscription's
    // async generator when the client goes away mid-turn.
    mockModel = new MockLanguageModelV3({
      doStream: {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "1" },
          { type: "text-delta", id: "1", delta: "Hello" },
        ]),
      },
    })

    const generator = runTurn(
      { conversationID: "c1", message: "Hi" },
      ({} as unknown) as GraphQLSchema,
      fakeContext()
    )
    await generator.next()
    await generator.return(undefined as any)

    const signal = mockModel.doStreamCalls[0].abortSignal
    expect(signal?.aborted).toBe(true)
  })
  describe("per-user rate limiting", () => {
    it("checks the limit against the calling user before any model call", async () => {
      mockModel = new MockLanguageModelV3({
        doStream: {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
          ]),
        },
      })

      await collectEvents({ conversationID: "c1", message: "Hi" })

      expect(mockRateLimitByUser).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "ai_agent_turn", userID: "user-42" })
      )
    })

    it("yields a single rate_limited event and never calls the model", async () => {
      mockRateLimitByUser.mockResolvedValue({ allowed: false, count: 31 })
      mockModel = new MockLanguageModelV3({
        doStream: {
          stream: convertArrayToReadableStream([
            { type: "stream-start", warnings: [] },
          ]),
        },
      })

      const events = await collectEvents({
        conversationID: "c1",
        message: "Hi",
      })

      expect(events).toEqual([
        {
          __typename: "AIAgentTurnComplete",
          message: null,
          artworks: null,
          stopReason: "rate_limited",
          toolCallCount: 0,
        },
      ])
      expect(mockModel.doStreamCalls).toHaveLength(0)
      expect(mockToolExecute).not.toHaveBeenCalled()
    })

    it("does not load the system prompt when rate limited", async () => {
      mockRateLimitByUser.mockResolvedValue({ allowed: false, count: 31 })
      const context = fakeContext()
      await collectEvents({ conversationID: "c1", message: "Hi" }, context)
      expect(context.aiPromptTemplatesLoader).not.toHaveBeenCalled()
    })
  })
})
