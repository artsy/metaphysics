import { streamText, stepCountIs, type ModelMessage } from "ai"
import { GraphQLSchema } from "graphql"
import * as Sentry from "@sentry/node"
import config from "config"
import { anthropicProvider } from "lib/apis/anthropic"
import { ResolverContext } from "types/graphql"
import { buildAgentTools, summarizeToolCall, AIAgentToolRunResult } from "./tools"
import {
  AIAgentEventPayload,
  AIAgentTextDeltaPayload,
  AIAgentToolCallPayload,
  AIAgentToolResultPayload,
  AIAgentTurnCompletePayload,
} from "./types"

const FALLBACK_SYSTEM_PROMPT = `
You are Artsy's AI assistant. Answer questions about artists, artworks, shows,
and fairs using the provided tools. Only state facts returned by a tool call —
never invent artist names, prices, or availability. If a tool call fails or
returns nothing useful, say so plainly rather than guessing.
`.trim()

const AI_PROMPT_TEMPLATE_NAME = "agent_assistant_system_prompt"
const MAX_TOKENS = 8000

async function loadSystemPrompt(context: ResolverContext): Promise<string> {
  try {
    const { body } = await context.aiPromptTemplatesLoader({
      name: AI_PROMPT_TEMPLATE_NAME,
      model: "claude",
      size: 1,
    })
    const systemPrompt = body?.[0]?.system_prompt
    return typeof systemPrompt === "string" && systemPrompt.length > 0
      ? systemPrompt
      : FALLBACK_SYSTEM_PROMPT
  } catch (error) {
    Sentry.captureException(error)
    return FALLBACK_SYSTEM_PROMPT
  }
}

function buildMessages(
  history: Array<{ role: string; content: string }> | null | undefined,
  message: string
): ModelMessage[] {
  const priorMessages: ModelMessage[] = (history ?? []).map((entry) => ({
    role: entry.role as "user" | "assistant",
    content: entry.content,
  }))

  return [...priorMessages, { role: "user", content: message }]
}

/**
 * Runs one agent turn, yielding AIAgentEvent payloads as they happen.
 *
 * Never throws: a runtime failure always surfaces as a terminal
 * AIAgentTurnComplete event instead, so graphql-js never has to reject a
 * live SSE stream mid-flight.
 */
export async function* runTurn(
  input: { conversationID: string; message: string; history?: any },
  schema: GraphQLSchema,
  context: ResolverContext
): AsyncGenerator<AIAgentEventPayload> {
  const provider = anthropicProvider()
  const abortController = new AbortController()
  const timeout = setTimeout(
    () => abortController.abort(),
    config.AI_AGENT_TURN_TIMEOUT_MS
  )

  let toolCallCount = 0

  try {
    const system = await loadSystemPrompt(context)
    const messages = buildMessages(input.history, input.message)
    const tools = buildAgentTools(schema, context)

    const result = streamText({
      model: provider(config.AI_AGENT_MODEL),
      // Cache breakpoint on the system prompt: it's byte-stable across steps
      // and turns (fixed tool order, no timestamps/request IDs), so this
      // prefix is a cache hit on every follow-up call.
      system: {
        role: "system",
        content: system,
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      },
      messages,
      tools,
      stopWhen: stepCountIs(config.AI_AGENT_MAX_ITERATIONS),
      maxOutputTokens: MAX_TOKENS,
      abortSignal: abortController.signal,
      providerOptions: {
        anthropic: { thinking: { type: "adaptive" }, effort: "medium" },
      },
    })

    // Tracks the current step's text so the terminal event's `message` is
    // the final step's answer, not every step's commentary concatenated together.
    let stepText = ""

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "start-step":
          stepText = ""
          break

        case "text-delta": {
          stepText += part.text
          const payload: AIAgentTextDeltaPayload = {
            __typename: "AIAgentTextDelta",
            text: part.text,
          }
          yield payload
          break
        }

        case "tool-call": {
          toolCallCount += 1
          const payload: AIAgentToolCallPayload = {
            __typename: "AIAgentToolCall",
            toolName: part.toolName,
            summary: summarizeToolCall(part.input),
          }
          yield payload
          break
        }

        case "tool-result": {
          const output = part.output as AIAgentToolRunResult
          const payload: AIAgentToolResultPayload = {
            __typename: "AIAgentToolResult",
            toolName: part.toolName,
            ok: output.ok,
            summary: output.ok ? null : output.content,
          }
          yield payload
          break
        }

        case "tool-error": {
          // Defensive: runQueryArtsyTool returns { ok: false } rather than throwing.
          Sentry.captureException(part.error)
          const payload: AIAgentToolResultPayload = {
            __typename: "AIAgentToolResult",
            toolName: part.toolName,
            ok: false,
            summary: String(part.error),
          }
          yield payload
          break
        }

        case "abort": {
          const payload: AIAgentTurnCompletePayload = {
            __typename: "AIAgentTurnComplete",
            message: null,
            stopReason: "aborted",
            toolCallCount,
          }
          yield payload
          return
        }

        case "error": {
          Sentry.captureException(part.error)
          const payload: AIAgentTurnCompletePayload = {
            __typename: "AIAgentTurnComplete",
            message: null,
            stopReason: "error",
            toolCallCount,
          }
          yield payload
          return
        }

        case "finish": {
          // If `stopWhen`'s step cap was hit while the model still wanted to
          // call tools, the loop stops mid-flow and finishReason stays
          // "tool-calls" (a natural stop reports "stop" instead).
          const hitCap = part.finishReason === "tool-calls"
          const payload: AIAgentTurnCompletePayload = {
            __typename: "AIAgentTurnComplete",
            message: hitCap ? null : stepText || null,
            stopReason: hitCap ? "max_iterations" : part.finishReason,
            toolCallCount,
          }
          yield payload
          break
        }
      }
    }
  } catch (error) {
    Sentry.captureException(error)
    const payload: AIAgentTurnCompletePayload = {
      __typename: "AIAgentTurnComplete",
      message: null,
      stopReason: "error",
      toolCallCount,
    }
    yield payload
  } finally {
    clearTimeout(timeout)
    // If the consumer tears down the subscription early, graphql-js calls
    // `.return()` on this generator, running this `finally` while an
    // Anthropic request may still be in flight — abort it so it doesn't leak.
    abortController.abort()
  }
}
