import type { PhoenixSpan } from "lib/apis/phoenix"

const mockExportSpans = jest.fn()
jest.mock("lib/apis/phoenix", () => ({
  exportSpans: (...args: unknown[]) => mockExportSpans(...args),
}))

import { TurnTrace } from "../turnTrace"

const newTrace = () =>
  new TurnTrace({
    conversationID: "conversation-1",
    userID: "user-42",
    message: "Find Warhol",
    hasImage: false,
  })

const answered = {
  message: "Found Andy Warhol.",
  stopReason: "stop",
  toolCallCount: 1,
  section: null,
  suggestedReplies: null,
}

/** The spans of the one export the test expects. */
const exportedSpans = (): PhoenixSpan[] => {
  expect(mockExportSpans).toHaveBeenCalledTimes(1)
  return mockExportSpans.mock.calls[0][1]
}

describe("TurnTrace", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExportSpans.mockResolvedValue(true)
  })

  it("has a sampled W3C traceparent naming its trace and root span", () => {
    const trace = newTrace()

    expect(trace.traceID).toMatch(/^[0-9a-f]{32}$/)
    expect(trace.traceparent).toMatch(
      new RegExp(`^00-${trace.traceID}-[0-9a-f]{16}-01$`)
    )
  })

  it("exports a root AGENT span with a TOOL child to the metaphysics project", () => {
    const trace = newTrace()
    trace.toolCall("call-1", "query_artsy", { query: "{ me { name } }" })
    trace.toolResult("call-1", { ok: true, content: '{"me":null}' })
    trace.finish(answered)

    expect(mockExportSpans.mock.calls[0][0]).toEqual("metaphysics")
    const [root, tool] = exportedSpans()

    expect(root).toMatchObject({
      name: "ai_agent_turn",
      span_kind: "AGENT",
      parent_id: null,
      status_code: "OK",
      context: {
        trace_id: trace.traceID,
        span_id: trace.traceparent.split("-")[2],
      },
    })
    expect(root.attributes).toMatchObject({
      "session.id": "conversation-1",
      "user.id": "user-42",
      "input.value": "Find Warhol",
      "output.value": "Found Andy Warhol.",
      metadata: { model: "art-assistant", stopReason: "stop" },
    })

    expect(tool).toMatchObject({
      name: "query_artsy",
      span_kind: "TOOL",
      parent_id: root.context.span_id,
      status_code: "OK",
      context: { trace_id: trace.traceID },
    })
    expect(tool.attributes).toMatchObject({
      "tool.name": "query_artsy",
      "input.value": '{"query":"{ me { name } }"}',
      "output.value": '{"me":null}',
    })
  })

  it("adds the cards shown under the answer to its output", () => {
    newTrace().finish({
      ...answered,
      section: {
        __typename: "AIAgentArtworksSection",
        artworks: [
          {
            _id: "artwork-1",
            id: "andy-warhol-flowers",
            title: "Flowers",
            date: "1970",
            artist: { name: "Andy Warhol" },
            partner: { name: "Gallery" },
            sale_message: "US$4,500",
          },
          // Whatever a record lacks is left out, not the card.
          { _id: "artwork-2", id: "untitled" },
        ],
      },
    })

    const { attributes } = exportedSpans()[0]
    expect(attributes["output.value"]).toEqual(
      [
        "Found Andy Warhol.",
        "- [Flowers, 1970](https://www.artsy.net/artwork/andy-warhol-flowers) — Andy Warhol — Gallery — US$4,500",
        "- [Untitled](https://www.artsy.net/artwork/untitled)",
      ].join("\n\n")
    )
    expect(attributes.metadata).toMatchObject({
      sectionType: "AIAgentArtworksSection",
      sectionIDs: ["artwork-1", "artwork-2"],
    })
  })

  it("ends its output with the suggested replies", () => {
    newTrace().finish({
      ...answered,
      suggestedReplies: [{ text: "Show me more" }, { text: "Only prints" }],
    })

    expect(exportedSpans()[0].attributes["output.value"]).toEqual(
      "Found Andy Warhol.\n\nSuggested replies:\n- Show me more\n- Only prints"
    )
  })

  it("marks a failed tool, and one the turn ended before it returned, as ERROR", () => {
    const trace = newTrace()
    trace.toolCall("call-1", "query_artsy", { query: "{ nope }" })
    trace.toolResult("call-1", { ok: false, content: "Cannot query nope" })
    trace.toolCall("call-2", "query_artsy", { query: "{ me { name } }" })
    trace.finish(answered)

    const [, failed, unfinished] = exportedSpans()
    expect(failed.status_code).toEqual("ERROR")
    expect(failed.status_message).toEqual("tool failed")
    expect(unfinished.status_code).toEqual("ERROR")
    expect(unfinished.status_message).toEqual("no result")
    expect(unfinished.attributes).not.toHaveProperty("output.value")
  })

  it.each([
    ["error", "ERROR"],
    ["aborted", "ERROR"],
    // The collector leaving early isn't a failure of the turn.
    ["client_disconnected", "OK"],
  ])("marks the root of a turn stopped with %s as %s", (stopReason, status) => {
    newTrace().finish({ ...answered, message: null, stopReason })

    expect(exportedSpans()[0].status_code).toEqual(status)
  })

  it("exports only once, keeping the first outcome", () => {
    const trace = newTrace()
    trace.finish(answered)
    trace.finish({ ...answered, stopReason: "aborted" })

    expect(exportedSpans()[0].status_code).toEqual("OK")
  })

  it("never throws or leaves an unhandled rejection when the export fails", async () => {
    const unhandled = jest.fn()
    process.on("unhandledRejection", unhandled)
    mockExportSpans.mockRejectedValue(new Error("Phoenix is down"))

    try {
      expect(() => newTrace().finish(answered)).not.toThrow()
      // Let the rejection (and any unhandled-rejection report) settle.
      await new Promise((resolve) => setImmediate(resolve))
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off("unhandledRejection", unhandled)
    }
  })
})
