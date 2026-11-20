import { trace } from "@opentelemetry/api"
import type { Attributes } from "@opentelemetry/api"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import { ExportResultCode } from "@opentelemetry/core"
import config from "config"
import * as loggers from "lib/loggers"

import {
  SentryAgentSpanExporter,
  agentTracer,
  parseHeaders,
} from "../agentTracing"

const ENDPOINT = "https://example.invalid/v1/traces"

const span = (
  name: string,
  attributes: Record<string, unknown>,
  traceId = "trace"
): ReadableSpan =>
  (({
    name,
    attributes,
    spanContext: () => ({ traceId }),
  } as unknown) as ReadableSpan)

/** Returns the attributes each span carried by the time Sentry would see it. */
const exporter = (delegate?: Partial<SpanExporter>) => {
  let batch: ReadableSpan[] = []
  const subject = new SentryAgentSpanExporter({
    export: (spans, done) => {
      batch = spans
      done({ code: ExportResultCode.SUCCESS })
    },
    shutdown: () => Promise.resolve(),
    ...delegate,
  })

  return (...spans: ReadableSpan[]): Attributes[] => {
    subject.export(spans, () => undefined)
    return batch.map((s) => s.attributes)
  }
}

/** Unique per test: the per-trace cache is module-level. */
let counter = 0
const traceId = () => `trace-${(counter += 1)}`

describe("agentTracer", () => {
  const original = config.AI_AGENT_OTLP_ENDPOINT

  afterEach(async () => {
    ;(config as any).AI_AGENT_OTLP_ENDPOINT = original
  })

  it("is disabled unless an OTLP endpoint is configured", () => {
    ;(config as any).AI_AGENT_OTLP_ENDPOINT = undefined
    expect(agentTracer()).toBeUndefined()
    ;(config as any).AI_AGENT_OTLP_ENDPOINT = ENDPOINT
    expect(agentTracer()).toBeDefined()
  })

  // dd-trace is the app's APM; a global OTel provider would compete with it.
  it("never registers a global tracer provider", () => {
    const before = trace.getTracerProvider()
    ;(config as any).AI_AGENT_OTLP_ENDPOINT = ENDPOINT
    agentTracer()
    expect(trace.getTracerProvider()).toBe(before)
  })
})

describe("parseHeaders", () => {
  it("splits on the first `=` only", () => {
    // Sentry's value contains an `=`; truncating it would 401 every export.
    expect(
      parseHeaders("x-sentry-auth=sentry sentry_key=abc,x-ok=yes")
    ).toEqual({ "x-sentry-auth": "sentry sentry_key=abc", "x-ok": "yes" })
  })

  // Pasting Sentry's header *value* without the `x-sentry-auth=` name would
  // otherwise throw "invalid header name" from deep inside the exporter.
  it("drops an illegal header name without logging its value", () => {
    const logged: string[] = []
    const spy = jest.spyOn(loggers, "error").mockImplementation(((
      m: string
    ) => {
      logged.push(m)
    }) as any)

    expect(parseHeaders("sentry sentry_key=super-secret,x-ok=yes")).toEqual({
      "x-ok": "yes",
    })
    expect(logged.join(" ")).not.toContain("super-secret")
    spy.mockRestore()
  })
})

describe("SentryAgentSpanExporter", () => {
  // The spellings differ between the root span and its children, and each of
  // these was wrong at some point, emptying a column in the Agents dashboard.
  it.each([
    ["ai.prompt.messages", "gen_ai.input.messages", "[msg]", "[msg]"],
    ["ai.prompt.messages", "gen_ai.request.messages", "[msg]", "[msg]"],
    ["ai.prompt", "gen_ai.input.messages", "{root}", "{root}"],
    [
      "ai.model.provider",
      "gen_ai.provider.name",
      "anthropic.messages",
      "anthropic",
    ],
    ["ai.usage.totalTokens", "gen_ai.usage.total_tokens", 29686, 29686],
    [
      "ai.usage.cachedInputTokens",
      "gen_ai.usage.input_tokens.cached",
      28563,
      28563,
    ],
  ])("maps %s onto %s", (from, to, value, expected) => {
    const send = exporter()
    const [attributes] = send(
      span("ai.streamText", { [from]: value }, traceId())
    )
    expect(attributes[to]).toBe(expected)
  })

  it("maps span names onto Sentry's operations", () => {
    const send = exporter()
    const [agent, chat, tool] = send(
      span("ai.streamText", {}, traceId()),
      span("ai.streamText.doStream", {}, traceId()),
      span("ai.toolCall", {}, traceId())
    )

    expect(agent["gen_ai.operation.name"]).toBe("invoke_agent")
    expect(agent["sentry.op"]).toBe("gen_ai.invoke_agent")
    expect(chat["gen_ai.operation.name"]).toBe("chat")
    expect(tool["gen_ai.operation.name"]).toBe("execute_tool")
  })

  it("never overwrites an attribute the AI SDK already set", () => {
    const send = exporter()
    const [attributes] = send(
      span(
        "ai.streamText",
        { "ai.prompt.messages": "[preferred]", "ai.prompt": "{fallback}" },
        traceId()
      )
    )

    expect(attributes["gen_ai.input.messages"]).toBe("[preferred]")
  })

  // The AI SDK sets these on model spans only, so tool spans must borrow them
  // or the Agents list renders an empty Tools column.
  it("carries conversation and model details across spans of a trace", () => {
    const send = exporter()
    const id = traceId()
    const model = {
      "ai.telemetry.metadata.conversationID": "conversation-1",
      "ai.model.provider": "anthropic.messages",
      "ai.model.id": "claude-sonnet-5",
      "ai.response.model": "claude-sonnet-5-20260101",
    }

    // A later batch...
    send(span("ai.streamText", model, id))
    const [later] = send(span("ai.toolCall", {}, id))

    expect(later["gen_ai.conversation.id"]).toBe("conversation-1")
    expect(later["gen_ai.provider.name"]).toBe("anthropic")
    expect(later["gen_ai.request.model"]).toBe("claude-sonnet-5")
    expect(later["gen_ai.response.model"]).toBe("claude-sonnet-5-20260101")

    // ...and earlier in the same batch, since a parent finishes last.
    const sameBatch = traceId()
    const [tool] = exporter()(
      span("ai.toolCall", {}, sameBatch),
      span("ai.streamText", model, sameBatch)
    )
    expect(tool["gen_ai.conversation.id"]).toBe("conversation-1")
  })

  it("does not leak details between conversations", () => {
    const send = exporter()
    send(
      span(
        "ai.streamText",
        { "ai.telemetry.metadata.conversationID": "other" },
        traceId()
      )
    )

    const [tool] = send(span("ai.toolCall", {}, traceId()))
    expect(tool["gen_ai.conversation.id"]).toBeUndefined()
  })

  // A failed export is indistinguishable from an idle agent, so it must be
  // logged -- once, since the processor retries on a timer.
  it("logs a failed export once per outage, not once per batch", () => {
    const logged: string[] = []
    const spy = jest.spyOn(loggers, "error").mockImplementation(((
      m: string
    ) => {
      logged.push(m)
    }) as any)
    let failing = true
    const send = exporter({
      export: (_spans, done) =>
        done(
          failing
            ? { code: ExportResultCode.FAILED, error: new Error("401") }
            : { code: ExportResultCode.SUCCESS }
        ),
    })
    const failures = () => logged.filter((m) => m.includes("export failed"))

    send(span("ai.streamText", {}, traceId()))
    send(span("ai.streamText", {}, traceId()))
    expect(failures()).toHaveLength(1)

    // A success re-arms, so a later outage is not silently swallowed.
    failing = false
    send(span("ai.streamText", {}, traceId()))
    failing = true
    send(span("ai.streamText", {}, traceId()))
    expect(failures()).toHaveLength(2)

    spy.mockRestore()
  })
})
