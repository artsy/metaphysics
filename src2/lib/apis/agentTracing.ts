/**
 * OpenTelemetry tracing for the AI agent, exported to Sentry over OTLP.
 * Disabled unless AI_AGENT_OTLP_ENDPOINT is set.
 *
 * Owns its TracerProvider and hands the tracer straight to `streamText`,
 * never calling `provider.register()`, so dd-trace stays the app's only APM.
 * The one global it sets is the OTel context manager, which span nesting
 * needs; dd-trace leaves those globals alone.
 *
 * The `gen_ai.*` mapping was derived against a live Sentry project rather than
 * a spec, so it is pinned by tests -- change it only with those passing.
 * Sentry's own `vercelAIIntegration` would replace all of this, but as of
 * @sentry/node 10.75 it drops the child spans of a streaming agent, leaving
 * the conversation with no tools, tokens or cost.
 */

import { context } from "@opentelemetry/api"
import type { Attributes, Tracer } from "@opentelemetry/api"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { ExportResultCode } from "@opentelemetry/core"
import type { ExportResult } from "@opentelemetry/core"
import config from "config"
import { error, warn } from "lib/loggers"

const SERVICE_NAME = "metaphysics-ai-agent"
const TRACES_PATH = "/v1/traces"

/** The AI SDK emits `ai.*` span names; Sentry keys off `gen_ai.operation.name`. */
const OPERATION_BY_SPAN_NAME: Record<string, string> = {
  "ai.streamText": "invoke_agent",
  "ai.streamText.doStream": "chat",
  "ai.toolCall": "execute_tool",
}

const ATTRIBUTE_RENAMES: Record<string, string[]> = {
  "ai.telemetry.metadata.conversationID": ["gen_ai.conversation.id"],
  "ai.telemetry.functionId": ["gen_ai.agent.name"],
  // Sentry titles the conversation from `request.messages` but renders the
  // Input tab from `input.messages`.
  "ai.prompt.messages": ["gen_ai.request.messages", "gen_ai.input.messages"],
  // The root span spells it `ai.prompt`. Listed second so `ai.prompt.messages`
  // wins where both exist.
  "ai.prompt": ["gen_ai.request.messages", "gen_ai.input.messages"],
  "ai.response.text": ["gen_ai.response.text", "gen_ai.output.messages"],
  "ai.response.model": ["gen_ai.response.model"],
  "ai.model.id": ["gen_ai.request.model"],
  // Only the child `doStream` spans get `gen_ai.usage.*` natively.
  "ai.usage.inputTokens": ["gen_ai.usage.input_tokens"],
  "ai.usage.outputTokens": ["gen_ai.usage.output_tokens"],
  // Sentry's own eval export ranks conversations by sum(total_tokens).
  "ai.usage.totalTokens": ["gen_ai.usage.total_tokens"],
  // Subsets of `input_tokens`, which Sentry prices separately. Omitting them
  // bills every cache hit at full rate, and the system prompt is cached.
  "ai.usage.cachedInputTokens": ["gen_ai.usage.input_tokens.cached"],
  "ai.usage.inputTokenDetails.cacheWriteTokens": [
    "gen_ai.usage.input_tokens.cache_write",
  ],
  "ai.toolCall.name": ["gen_ai.tool.name"],
  "ai.toolCall.args": ["gen_ai.tool.input"],
  "ai.toolCall.result": ["gen_ai.tool.output"],
}

/**
 * Set on model spans only, but Sentry wants them on every span of a
 * conversation, or the Agents list renders an empty Tools column.
 */
const INHERITED_ATTRIBUTES = [
  "gen_ai.conversation.id",
  "gen_ai.provider.name",
  "gen_ai.request.model",
  "gen_ai.response.model",
] as const

/** Bounded, since `ai.toolCall` can be exported in a later batch than its model span. */
const MAX_TRACKED_TRACES = 500
const inheritedByTrace = new Map<string, Record<string, string>>()

/**
 * Renames the AI SDK's attributes. Pure, so it also derives what a span
 * contributes to its trace -- both callers must agree or inheritance breaks.
 */
function translate(source: Attributes): Attributes {
  const attributes: Attributes = { ...source }

  for (const [from, targets] of Object.entries(ATTRIBUTE_RENAMES)) {
    if (source[from] === undefined) continue
    for (const to of targets) {
      if (attributes[to] === undefined) attributes[to] = source[from]
    }
  }

  // `gen_ai.system` is the older name, and `ai.model.provider` is qualified
  // ("anthropic.messages").
  if (attributes["gen_ai.provider.name"] === undefined) {
    const provider = source["gen_ai.system"] ?? source["ai.model.provider"]
    if (typeof provider === "string") {
      attributes["gen_ai.provider.name"] = provider.split(".")[0]
    }
  }

  return attributes
}

function remember(traceId: string, attributes: Attributes): void {
  const found: Record<string, string> = {}
  for (const key of INHERITED_ATTRIBUTES) {
    const value = attributes[key]
    if (typeof value === "string") found[key] = value
  }
  if (Object.keys(found).length === 0) return

  inheritedByTrace.set(traceId, { ...inheritedByTrace.get(traceId), ...found })

  if (inheritedByTrace.size > MAX_TRACKED_TRACES) {
    // Map iterates in insertion order, so this drops the oldest.
    inheritedByTrace.delete(inheritedByTrace.keys().next().value as string)
  }
}

function reshape(span: ReadableSpan): ReadableSpan {
  const attributes = translate(span.attributes)

  const inherited = inheritedByTrace.get(span.spanContext().traceId)
  if (inherited) {
    for (const key of INHERITED_ATTRIBUTES) {
      if (attributes[key] === undefined && inherited[key] !== undefined) {
        attributes[key] = inherited[key]
      }
    }
  }

  const operation = OPERATION_BY_SPAN_NAME[span.name]
  if (operation) {
    attributes["gen_ai.operation.name"] = operation
    attributes["sentry.op"] = `gen_ai.${operation}`
  }

  // ReadableSpan is read-only by contract, hence the shallow clone.
  return Object.create(Object.getPrototypeOf(span), {
    ...Object.getOwnPropertyDescriptors(span),
    attributes: { value: attributes, enumerable: true },
  })
}

let hasReportedExportFailure = false

/**
 * A failed export looks exactly like an idle agent, so say so -- but once per
 * outage, not once per batch, since the processor retries on a timer. Log
 * only: metaphysics sets no SENTRY_PRIVATE_DSN, so `captureException` would be
 * a silent no-op.
 */
function reportFailure(cause?: Error): void {
  if (hasReportedExportFailure) return
  hasReportedExportFailure = true
  error(`[agentTracing] span export failed: ${cause?.message}`)
}

export class SentryAgentSpanExporter implements SpanExporter {
  constructor(private readonly delegate: SpanExporter) {}

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    // Record the whole batch first: a parent finishes last, so a tool span can
    // precede the model span it borrows from.
    for (const span of spans) {
      remember(span.spanContext().traceId, translate(span.attributes))
    }

    this.delegate.export(spans.map(reshape), (result) => {
      if (result.code === ExportResultCode.FAILED) {
        reportFailure(result.error)
      } else {
        // Re-arm: otherwise one blip at boot mutes every later outage.
        hasReportedExportFailure = false
      }
      resultCallback(result)
    })
  }

  shutdown(): Promise<void> {
    return this.delegate.shutdown()
  }
}

/** RFC 9110 token characters. */
const VALID_HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

/**
 * `AI_AGENT_OTLP_HEADERS` is `k=v,k=v`, matching OTEL_EXPORTER_OTLP_HEADERS.
 * Sentry's Client Keys page shows only the header *value*, so pasting
 * `sentry sentry_key=...` without the `x-sentry-auth=` name is easy and would
 * otherwise throw from deep inside the exporter.
 */
export function parseHeaders(raw?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  if (!raw) return headers

  for (const pair of raw.split(",")) {
    // A trailing or doubled comma is formatting slack, not a misconfiguration.
    if (!pair.trim()) continue

    // First `=` only: the Sentry auth header's value contains one.
    const index = pair.indexOf("=")
    const name = index > 0 ? pair.slice(0, index).trim() : ""

    // Never log the value -- it is a credential.
    if (!VALID_HEADER_NAME.test(name)) {
      error(
        `[agentTracing] ignoring malformed AI_AGENT_OTLP_HEADERS entry "${name}"` +
          " -- expected `x-sentry-auth=sentry sentry_key=<public key>`"
      )
      continue
    }

    headers[name] = pair.slice(index + 1).trim()
  }

  return headers
}

let tracer: Tracer | undefined
let provider: NodeTracerProvider | undefined

export const agentTracer = (): Tracer | undefined => {
  const { AI_AGENT_OTLP_ENDPOINT, AI_AGENT_OTLP_HEADERS } = config
  if (!AI_AGENT_OTLP_ENDPOINT) return undefined

  if (!tracer) {
    // Sentry's Client Keys page shows the base endpoint, which 404s.
    if (!AI_AGENT_OTLP_ENDPOINT.endsWith(TRACES_PATH)) {
      warn(
        `[agentTracing] AI_AGENT_OTLP_ENDPOINT does not end in ${TRACES_PATH}; exports will likely 404.`
      )
    }

    provider = new NodeTracerProvider({
      resource: resourceFromAttributes({ "service.name": SERVICE_NAME }),
      spanProcessors: [
        new BatchSpanProcessor(
          new SentryAgentSpanExporter(
            new OTLPTraceExporter({
              url: AI_AGENT_OTLP_ENDPOINT,
              headers: parseHeaders(AI_AGENT_OTLP_HEADERS),
            })
          )
        ),
      ],
    })

    // The AI SDK nests via `startActiveSpan`, which reads the global OTel
    // context; with no context manager every span becomes its own trace.
    // Much narrower than `provider.register()`, and dd-trace keeps its own
    // scope independently.
    context.setGlobalContextManager(new AsyncLocalStorageContextManager())

    tracer = provider.getTracer("ai-agent")
  }

  return tracer
}
