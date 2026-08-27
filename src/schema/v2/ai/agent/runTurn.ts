import { streamText, stepCountIs, parsePartialJson, Output } from "ai"
import type { ModelMessage } from "ai"
import { GraphQLSchema } from "graphql"
import * as Sentry from "@sentry/node"
import config from "config"
import { z } from "zod"
import { anthropicProvider } from "lib/apis/anthropic"
import { rateLimitByUser } from "lib/rateLimitByUser"
import { warn } from "lib/loggers"
import { ResolverContext } from "types/graphql"
import {
  buildAgentTools,
  summarizeToolCall,
  AIAgentToolRunResult,
} from "./tools"
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

\`artworkIDs\` and \`message\` are two halves of one answer: \`artworkIDs\` *is* the
result set — the client renders each id as an image card — and \`message\` is the
one or two sentences framing it: what you searched for and what filters you
applied.

So whenever a tool call surfaced artworks that answer the question, populate
\`artworkIDs\` with their exact \`internalID\` from those results — the
24-character hex id, copied verbatim. It must be the \`internalID\` and nothing
else: a slug, a title, or an invented id renders no card at all, so always
select \`internalID\` on any artwork you might cite. Do NOT list, number, or describe the individual artworks in
\`message\`; the cards already show them. That deliberate omission is not a
reason to leave \`artworkIDs\` empty — a \`message\` that describes having found
works, paired with an empty \`artworkIDs\`, renders as text with no images, which
is a broken answer.

Leave \`artworkIDs\` empty only when you found no artworks, or the question isn't
about artworks at all. Mention an individual work in \`message\` only when the
user asked about that one specific work.

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
      "The 24-character hex `internalID` of every artwork this answer is " +
        "based on, copied exactly from query_artsy tool results. Must be the " +
        "internalID -- a slug or title renders nothing. These become image " +
        "cards and are the only way the user sees the works, so populate " +
        "this whenever a tool call surfaced artworks that answer the " +
        "question -- `message` deliberately does not name them. Empty only " +
        "when no artworks were found, or the question isn't about artworks."
    ),
})

/**
 * Gravity's /artworks?ids[]= neither guarantees response order nor returns a
 * placeholder for an id it can't resolve, so what comes back is a set, not a
 * sequence -- see recentlySoldArtworks, which re-joins on `_id` for the same
 * reason. Restore the model's ordering, which is the only relevance signal the
 * cards carry.
 *
 * Ids that resolve to nothing (deleted, unpublished, or hallucinated) just
 * don't get a card: per AgentOutputSchema the model supplies identifiers and
 * never display data, so a bad one fails as a missing card, never a wrong one.
 */
function orderArtworksByCitedIDs(artworks: any[], citedIDs: string[]) {
  const byInternalID = new Map<string, any>()
  artworks.forEach((artwork) => {
    if (artwork?._id) byInternalID.set(artwork._id, artwork)
  })

  const ordered: any[] = []
  const seen = new Set<string>()
  citedIDs.forEach((id) => {
    const artwork = byInternalID.get(id)
    // `seen` guards the model citing the same work twice.
    if (!artwork || seen.has(id)) return
    seen.add(id)
    ordered.push(artwork)
  })

  return ordered
}

/**
 * Gravity's batch endpoint (/artworks?ids[]=) matches on internalID only
 */
const INTERNAL_ID = /^[0-9a-f]{24}$/i

async function resolveArtworks(
  ids: string[],
  context: ResolverContext
): Promise<unknown[]> {
  if (ids.length === 0) return []
  const citedIDs = ids.slice(0, MAX_ARTWORK_IDS)
  const internalIDs = citedIDs.filter((id) => INTERNAL_ID.test(id))

  // Logged rather than passed through: a non-internalID citation resolves to
  // nothing, and a card that never renders is invisible from the outside --
  // which is how a slug-citing answer previously read as a working turn with
  // an empty `artworks`. If this line stays quiet, the prompt is holding.
  if (internalIDs.length < citedIDs.length) {
    const dropped = citedIDs.filter((id) => !INTERNAL_ID.test(id))
    warn(
      `[aiAgentTurn] dropped ${dropped.length} of ${citedIDs.length} artwork ` +
        `citation(s), not internalIDs: ${JSON.stringify(dropped.slice(0, 3))}`
    )
  }
  if (internalIDs.length === 0) return []

  try {
    const artworks = await context.artworksLoader({ ids: internalIDs })
    return orderArtworksByCitedIDs(artworks, internalIDs)
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
  // Before any model spend: one turn can be several Anthropic calls, and the
  // IP-based limiter doesn't cover this field (see lib/rateLimitByUser).
  // Enforced here rather than in `subscribe` because that must stay
  // synchronous, and this needs a memcached round-trip.
  const { allowed } = await rateLimitByUser({
    scope: "ai_agent_turn",
    userID: context.userID as string,
    max: config.AI_AGENT_RATE_LIMIT_MAX,
    windowSeconds: Math.ceil(config.AI_AGENT_RATE_LIMIT_WINDOW_MS / 1000),
  })
  if (!allowed) {
    const payload: AIAgentTurnCompletePayload = {
      __typename: "AIAgentTurnComplete",
      message: null,
      artworks: null,
      stopReason: "rate_limited",
      toolCallCount: 0,
    }
    yield payload
    return
  }

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
          if (
            typeof message === "string" &&
            message.length > sentMessageLength
          ) {
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
            summary: "The query could not be run.",
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
