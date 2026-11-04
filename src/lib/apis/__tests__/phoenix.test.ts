import config from "config"
import * as loggers from "lib/loggers"
import { annotateTrace, exportSpans, PhoenixSpan } from "lib/apis/phoenix"

const mockFetch = jest.fn()
jest.mock("node-fetch", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockFetch(...args),
}))

const TRACE_ID = "0af7651916cd43dd8448eb211c80319c"

const span: PhoenixSpan = {
  name: "agent turn",
  context: { trace_id: TRACE_ID, span_id: "b7ad6b7169203331" },
  parent_id: null,
  span_kind: "AGENT",
  start_time: "2026-11-03T10:00:00.000Z",
  end_time: "2026-11-03T10:00:01.000Z",
  status_code: "OK",
  attributes: { "input.value": "hi" },
  events: [],
}

const feedback = {
  traceID: TRACE_ID,
  name: "user_feedback",
  identifier: "user-1",
  label: "thumbs_up",
  score: 1,
}

describe("phoenix", () => {
  const original = {
    LITELLM_BASE_URL: config.LITELLM_BASE_URL,
    LITELLM_API_KEY: config.LITELLM_API_KEY,
  }
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    ;(config as any).LITELLM_BASE_URL = "https://litellm.example.com"
    ;(config as any).LITELLM_API_KEY = "sk-secret-key"
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => "" })
    errorSpy = jest.spyOn(loggers, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    Object.assign(config, original)
    errorSpy.mockRestore()
  })

  const request = () => {
    const [url, init] = mockFetch.mock.calls[0]
    return { url, init, body: JSON.parse(init.body) }
  }

  it("exports spans to the project's pass-through route with no-log", async () => {
    await expect(exportSpans("metaphysics", [span])).resolves.toBe(true)

    const { url, init, body } = request()
    expect(url).toBe(
      "https://litellm.example.com/phoenix/v1/projects/metaphysics/spans"
    )
    expect(init.headers.authorization).toBe("Bearer sk-secret-key")
    expect(body).toEqual({ "no-log": true, data: [span] })
  })

  it("normalises a base URL ending in /v1/", async () => {
    ;(config as any).LITELLM_BASE_URL = "https://litellm.example.com/v1/"

    await exportSpans("metaphysics", [span])

    expect(request().url).toBe(
      "https://litellm.example.com/phoenix/v1/projects/metaphysics/spans"
    )
  })

  it("annotates a trace as a human judgment", async () => {
    await expect(annotateTrace(feedback)).resolves.toBe(true)

    expect(request().url).toBe(
      "https://litellm.example.com/phoenix/v1/trace_annotations"
    )
    expect(request().body.data).toEqual([
      {
        trace_id: TRACE_ID,
        name: "user_feedback",
        annotator_kind: "HUMAN",
        result: { label: "thumbs_up", score: 1, explanation: null },
        identifier: "user-1",
        metadata: {},
      },
    ])
  })

  it("rejects an invalid trace ID without calling Phoenix", async () => {
    await expect(
      annotateTrace({ ...feedback, traceID: "not-a-trace" })
    ).resolves.toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does nothing when the gateway isn't configured", async () => {
    ;(config as any).LITELLM_API_KEY = undefined

    await expect(exportSpans("metaphysics", [span])).resolves.toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // Tracing is a side channel: failures resolve false and never leak the key.
  it.each([
    [
      "an HTTP error",
      () =>
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "boom",
        }),
    ],
    [
      "a network error",
      () => mockFetch.mockRejectedValue(new Error("ECONNRESET")),
    ],
  ])("resolves false and logs on %s", async (_case, fail) => {
    fail()

    await expect(exportSpans("metaphysics", [span])).resolves.toBe(false)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).not.toContain("sk-secret-key")
  })
})
