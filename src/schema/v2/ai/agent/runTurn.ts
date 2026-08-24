import {
  streamText,
  stepCountIs,
  parsePartialJson,
  Output,
  type ModelMessage,
} from "ai"
import { GraphQLSchema } from "graphql"
import * as Sentry from "@sentry/node"
import config from "config"
import { z } from "zod"
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

When your answer references specific artworks, populate \`artworkIDs\` with their
exact internalID or slug from the tool results — never invented. The client
renders those as image cards, so do NOT list, number, or describe the individual
artworks in \`message\` — that would duplicate the cards. Keep \`message\` to one or
two sentences that frame the result set: what you searched for and what filters
you applied. Mention an individual work only when the user asked about that one
specific work.

## Workflow

Prefer a small number of well-formed queries over guessing. If you haven't used
a type this turn and aren't sure of its fields, introspect it once first:
\`{ __type(name: "Artwork") { fields { name type { name kind ofType { name kind } } } } }\`.
One introspection is cheaper than a retry loop.

## Recipes

Artworks by a named artist, with price/size filters:
  1. Resolve the artist first with
     \`matchConnection(term: "<name>", entities: [ARTIST], first: 1) { edges { node { ... on Artist { internalID slug name } } } }\`.
  2. Then
     \`artworksConnection(artistIDs: [<internalID>], priceRange: "<min>-<max>", first: <=20) { edges { node { internalID slug title artistNames saleMessage } } }\`.
  3. Never call \`artworksConnection\` without at least one of \`artistIDs\`,
     \`geneIDs\`, or \`keyword\` — an unfiltered call is not useful.

Artist details by slug:
  \`artist(id: "banksy") { internalID slug name birthday nationality biographyBlurb { text } }\`

Shows, searched by name or city and filtered by run status:
  \`showsConnection(term: "<name or city>", status: RUNNING, first: <=20) { edges { node { internalID slug name startAt endAt } } }\`

## Schema gotchas

- \`priceMin\`, \`priceMax\`, \`listPrice\`, \`estimate\`, \`fee\`, and similar
  money-typed fields return \`Money\`, not a scalar. Always select a subfield:
  \`{ display }\` for a formatted string, or \`{ major minor currencyCode }\` for
  numbers.
- \`Artwork.listPrice\` is a union of \`Money | PriceRange\` — use inline
  fragments:
  \`listPrice { ... on Money { display } ... on PriceRange { display minPrice { display } maxPrice { display } } }\`.
- \`Artwork.price\` and \`Artwork.saleMessage\` are plain \`String\` — no
  subselection.
- To filter \`artworksConnection\` by price, use the \`priceRange\` argument
  with the format \`"<min>-<max>"\` (in USD, e.g. \`"5000-20000"\`). Do not try
  to filter via \`priceMin\`/\`priceMax\` — those are output fields, not inputs.
- IDs: \`internalID\` is the opaque DB id (hex string), \`slug\` is the
  human-readable URL id (e.g. \`"banksy"\`). Both can be passed to
  \`artist(id: …)\` and \`artwork(id: …)\`. Prefer \`internalID\` when passing
  to array args like \`artistIDs\`.
- Available root fields are only:
  \`artworksConnection\`, \`artistsConnection\`, \`artist\`, \`artwork\`,
  \`showsConnection\`, \`matchConnection\`. Anything else will fail validation.
- \`matchConnection\` requires \`term\`; \`entities\` is optional and defaults to
  every searchable type, so pass it (e.g. \`[ARTIST]\`, \`[ARTWORK]\`) to narrow
  the results. Do not pass \`mode: INTERNAL_AUTOSUGGEST\` — it requires a
  signed-in Artsy admin session and will error.
- \`showsConnection\` has no geographic argument — there is no \`near\`, and no
  partner filter. Use \`term\` for a name or city, plus \`status\`
  (\`RUNNING\`, \`RUNNING_AND_UPCOMING\`, \`UPCOMING\`, \`CLOSED\`) and \`sort\`
  (e.g. \`START_AT_ASC\`).
- \`first\`/\`last\`/\`size\` are capped at 20. Ask for exactly what the user
  requested; do not over-fetch.
`.trim()

const AI_PROMPT_TEMPLATE_NAME = "agent_assistant_system_prompt"
const MAX_TOKENS = 8000
const MAX_ARTWORK_IDS = 20

// Structured final output: `message` is the prose answer (streamed to the
// client incrementally, see the text-delta case below); `artworkIDs` names
// which artworks to attach as real Artwork nodes (see resolveArtworks) --
// the model only supplies identifiers, never display data, so a
// hallucinated value fails as a missing card rather than a wrong one.
const AgentOutputSchema = z.object({
  message: z.string().describe("The prose answer to show the user."),
  artworkIDs: z
    .array(z.string())
    .describe(
      "internalID or slug of each artwork referenced in the answer, copied " +
        "exactly from query_artsy tool results. Empty if the answer doesn't " +
        "reference specific artworks."
    ),
})

async function resolveArtworks(
  ids: string[],
  context: ResolverContext
): Promise<unknown[]> {
  if (ids.length === 0) return []
  try {
    return await context.artworksLoader({ ids: ids.slice(0, MAX_ARTWORK_IDS) })
  } catch (error) {
    Sentry.captureException(error)
    return []
  }
}

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
      output: Output.object({ schema: AgentOutputSchema }),
      providerOptions: {
        anthropic: {
          thinking: { type: "adaptive" },
          effort: "medium",
          // Pinned rather than left on "auto": auto only resolves to this
          // mode for models with native structured-output support (verified
          // for claude-sonnet-5). A model without it would otherwise fall
          // back to a synthetic "json" tool call, which would show up to
          // the client as a spurious AIAgentToolCall.
          structuredOutputMode: "outputFormat",
        },
      },
    })

    // The model's final answer is generated as JSON matching AgentOutputSchema
    // (not prose), so text-deltas are raw JSON fragments -- reconstruct the
    // incremental `message` string by re-parsing the accumulated buffer as
    // partial JSON on each chunk and diffing against what's already been sent.
    let jsonBuffer = ""
    let sentMessageLength = 0

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "start-step":
          jsonBuffer = ""
          sentMessageLength = 0
          break

        case "text-delta": {
          jsonBuffer += part.text
          const parsed = await parsePartialJson(jsonBuffer)
          const message = (parsed.value as { message?: unknown } | undefined)
            ?.message
          if (typeof message === "string" && message.length > sentMessageLength) {
            const payload: AIAgentTextDeltaPayload = {
              __typename: "AIAgentTextDelta",
              text: message.slice(sentMessageLength),
            }
            sentMessageLength = message.length
            yield payload
          }
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
            artworks: null,
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
            artworks: null,
            stopReason: "error",
            toolCallCount,
          }
          yield payload
          return
        }

        case "finish": {
          // If `stopWhen`'s step cap was hit while the model still wanted to
          // call tools, the loop stops mid-flow and finishReason stays
          // "tool-calls" (a natural stop reports "stop" instead) -- in that
          // case the model never produced a final structured answer, so
          // there's nothing to await from `result.output`.
          const hitCap = part.finishReason === "tool-calls"
          const finalOutput = hitCap
            ? null
            : await Promise.resolve(result.output).catch((error) => {
                Sentry.captureException(error)
                return null
              })
          const artworks = finalOutput
            ? await resolveArtworks(finalOutput.artworkIDs, context)
            : null
          const payload: AIAgentTurnCompletePayload = {
            __typename: "AIAgentTurnComplete",
            message: finalOutput?.message ?? null,
            artworks,
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
      artworks: null,
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
