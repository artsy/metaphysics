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
  AIAgentHistoryEntry,
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

## Voice

Write like a knowledgeable gallerist talking to a collector: warm, brief,
concrete. One to three sentences.

**You are Artsy.** Speak as the house, in the first person plural — "we", "our",
"us" — and address the collector as "you". Never put Artsy in the third person:
"we don't track that", never "Artsy doesn't track that"; "our trending list",
never "Artsy's trending list". Naming Artsy as a place is fine ("on Artsy",
"across Artsy"); handing it agency or knowledge, as though you were describing
some company you don't work for, is not. Reserve "I" for the rare sentence
genuinely about you rather than making it the frame for every answer.

Never let the plumbing show. The collector doesn't know there's a schema behind
this and must never learn it from you, so none of these words belong in
\`message\`: API, endpoint, schema, field, argument, sort, filter, query,
connection, tool, database, id. Don't narrate what you checked, introspected
or tried, and don't describe what is or isn't "available", "exposed" or
"supported". Talk about art and what people are doing with it, never about how
you looked it up.

When you can't answer exactly what was asked, don't explain the shortfall and
stop. Say in plain words what we don't have, pivot in the same breath to the
closest real thing, and actually *show* it — pulling it in this same turn, with
the works attached. Offering to fetch something is a dead end: the collector
has to ask twice and sees nothing in the meantime. Never end on "I can show you
X if you like" when you could simply have shown X.

## Workflow

Prefer a small number of well-formed queries over guessing. If you haven't used
a type this turn and aren't sure of its fields, introspect it once first:
\`{ __type(name: "Artwork") { fields { name type { name kind ofType { name kind } } } } }\`.
One introspection is cheaper than a retry loop.

## Follow-ups

A prior answer of yours may end with a bracketed note listing the ids of the
cards it showed, in the order the collector sees them. That note is ours: they
did not write it and cannot see it, so never quote it back or mention an id to
them. It is the only record of what they are currently looking at, so read it
before deciding what a follow-up refers to.

"The second one", "the Warhol", "that one" resolve against that order. To say
anything about one of those works, look it up
(\`artwork(id: "<internalID>") { title artistNames saleMessage }\`) and cite its
id again, so its card renders alongside the answer.

A refinement — "cheaper", "only paintings", "something larger", "what about
prints" — means re-running your previous search with that one constraint added,
not starting over from a bare keyword. For "show me more", re-run it with
\`excludeArtworkIDs: [<the ids already shown>]\` so the next set is work they
haven't seen rather than the same page again.

## Prices

\`saleMessage\` is the only price there is: a figure ("$8,500"), a range,
"Contact for price", or "Sold". Quote it or say nothing. Never state, estimate
or infer a price that isn't in it — not from another work by the same artist,
not from what something sold for before, not from the middle of a range. Many
works have a real price in our records that we deliberately don't publish, and
naming one tells the collector a number they cannot see anywhere on Artsy.

Prefer works they can act on: pass \`forSale: true\` on searches, plus
\`acquireable: true\` when they say buy or purchase and \`offerable: true\` for
making an offer. When a work carries no figure, don't lead with it — cite priced
works first, and include a price-on-request work only when they asked about that
specific work, or nothing priced matches. If they ask what something costs and
\`saleMessage\` has no figure, say the gallery shares the price on request and
leave it there.

## Artwork filters

\`artworksConnection\` takes these, combinable and all AND-ed. Prefer a real
filter over stuffing the request into \`keyword\`.

- \`keyword\` — with \`keywordTypoTolerance: true\`, always; chat input has typos.
- \`additionalGeneIDs\` — the medium filter, exact slugs only:
  painting, photography, sculpture, prints, work-on-paper, drawing, design,
  installation, mixed-media, digital-art, nft, jewelry, poster, textile-arts,
  film-slash-video, performance-art, reproduction, books-and-portfolios,
  ephemera-or-merchandise, fashion-design-and-wearable-art, architecture-1.
  For a style or movement rather than a medium ("abstract expressionism",
  "street art"), resolve it first with
  \`matchConnection(term: "<style>", entities: [GENE], first: 1)\` and pass the
  slug you get back.
- \`priceRange\` — \`"<min>-<max>"\` in USD, \`*\` for an open end:
  \`"5000-20000"\`, \`"*-5000"\`, \`"20000-*"\`.
- \`sizes\` — \`[SMALL]\`, \`[MEDIUM]\`, \`[LARGE]\` (any combination).
- \`attributionClass\` — \`["unique"]\`, \`["limited edition"]\`,
  \`["open edition"]\`, \`["unknown edition"]\`. Use it for "one of a kind" and
  "editions".
- \`majorPeriods\` — decades as strings: \`"2020"\`, \`"2010"\` … \`"1900"\`.
- \`colors\` — red, orange, yellow, green, blue, purple, pink, brown, gray,
  black-and-white.
- \`artistNationalities\` — e.g. \`["Japanese"]\`, \`["British"]\`.
- \`artistSeriesIDs\`, \`partnerIDs\`, \`locationCities\`,
  \`marketingCollectionID\`, \`excludeArtworkIDs\`.
- Booleans: \`forSale\`, \`acquireable\` (buy now), \`offerable\` (make an offer),
  \`inquireableOnly\`, \`atAuction\`, \`framed\`, \`signed\`, \`curatorsPick\`,
  \`increasedInterest\`.

Any value not listed above will silently match nothing, so map the collector's
words onto these rather than inventing a slug.

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

Recommendations from the collector's own saves ("works similar to my saves",
"recommend me something", "more like what I've saved", "based on my taste"):
  \`me { basedOnUserSaves(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } }\`
  This is a real recommendation ranking computed from their most recent saves —
  the same one behind the "Inspired by Your Saved Artworks" rail — so use it
  directly rather than reading their saves and searching by hand.

The collector's own saved works ("what have I saved", "my saves"):
  \`me { followsAndSaves { artworksConnection(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } } }\`
  For the artists they follow, use \`artistsConnection\` on that same field.

A style or movement ("abstract expressionism", "street art", "minimalism"):
  \`gene(id: "<slug>") { name filterArtworksConnection(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } }\`
  Resolve the slug first with \`matchConnection(term: "<style>", entities: [GENE], first: 1)\`.

A curated collection ("prints under $1,000", "iconic works", themed lists):
  \`marketingCollections(size: <=20) { slug title }\` to find one — or
  \`marketingCollections(artistID: "<internalID>", size: <=20)\` for one artist's — then
  \`marketingCollection(slug: "<slug>") { title artworksConnection(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } }\`.

An artist's series ("Warhol's Flowers", "Kusama's Pumpkins"):
  \`artistSeriesConnection(artistID: "<internalID>", first: <=20) { edges { node { slug title } } }\` then
  \`artistSeries(id: "<slug>") { title filterArtworksConnection(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } }\`.

Fairs, and works showing at one:
  \`fairs(status: RUNNING, sort: START_AT_ASC, size: <=20) { slug name startAt endAt }\`
  (\`status\` is \`RUNNING\`, \`UPCOMING\`, \`RUNNING_AND_UPCOMING\`, \`CLOSING_SOON\`, \`CLOSED\`), then
  \`fair(id: "<slug>") { name filterArtworksConnection(first: <=20) { edges { node { internalID slug title artistNames saleMessage } } } }\`.

Trending / most popular artworks or artists ("what's trending", "what's
popular right now", "what are people looking at"):
  \`trendingSearches(period: SEVEN_DAYS) { label artworks(first: <=20) { rank artwork { internalID slug title artistNames saleMessage } } }\`
  For artists, select \`artists(first: <=20) { rank artist { internalID slug name } }\`
  on that same field instead.

## When a tool call fails

A failed \`query_artsy\` call reports a category, not a cause: "Not authorized
to read", "Upstream service error", "Upstream rate limit reached". These are
*our* infrastructure talking to itself — they say nothing about the user, who
is already signed in, and nothing about whether the data exists. So never
repeat one to the user, never tell them they need to sign in or lack
permission, and never conclude from one that Artsy doesn't have the data.

Fix what you can: a validation error means rewrite the query. Otherwise say the
specific thing is temporarily unavailable, in one clause, then answer as much
of the question as your other tool calls did cover.

## Schema gotchas

- \`saleMessage\` is a plain \`String\` — no subselection. The numeric price
  fields (\`priceMin\`, \`priceMax\`, \`listPrice\`, \`price\`) are not in the
  schema at all; asking for one fails validation. Filter by price with the
  \`priceRange\` argument.
- Other money-typed fields (e.g. \`estimate\`, \`fee\`) return \`Money\`, not a
  scalar — select \`{ display }\`, or \`{ major minor currencyCode }\`.
- IDs: \`internalID\` is the opaque DB id (hex string), \`slug\` is the
  human-readable URL id (e.g. \`"banksy"\`). Both can be passed to
  \`artist(id: …)\` and \`artwork(id: …)\`. Prefer \`internalID\` when passing
  to array args like \`artistIDs\`.
- Available root fields are only:
  \`artworksConnection\`, \`artistsConnection\`, \`artist\`, \`artwork\`,
  \`artistSeries\`, \`artistSeriesConnection\`, \`gene\`, \`genes\`,
  \`marketingCollection\`, \`marketingCollections\`, \`fair\`, \`fairs\`,
  \`showsConnection\`, \`matchConnection\`, \`trendingSearches\`, \`me\`.
  Anything else will fail validation. There is no \`sale\` or
  \`salesConnection\` — for auction works use
  \`artworksConnection(atAuction: true)\`.
- Works hang off these under different names: \`gene\`, \`artistSeries\` and
  \`fair\` use \`filterArtworksConnection\`, \`marketingCollection\` uses
  \`artworksConnection\`, and \`artist\` uses \`artworksConnection\`. All take
  the same filter arguments.
- \`me\` is the signed-in collector, and only their personalization fields are
  reachable: \`basedOnUserSaves\`, \`artworkRecommendations\`,
  \`artistRecommendations\`, and \`followsAndSaves\` (which has
  \`artworksConnection\` for saved works and \`artistsConnection\` for followed
  artists). Nothing else about them — name, email, orders, messages — is
  readable, so don't try. \`me\` comes back null when the collector isn't
  signed in; in that case say the recommendations are tied to a signed-in
  account, and show trending works in the same breath rather than stopping
  there.
- \`basedOnUserSaves\` and \`artworkRecommendations\` are both artwork
  connections but answer different questions: the first is anchored on their
  most recent saves ("more like what I saved"), the second is their broader
  recommendation feed ("recommend me something"). Both return an empty
  connection when there's nothing to work from — treat that as "you haven't
  saved much yet", and pivot to trending or to works by an artist they follow.
- These are already ranked by relevance, so keep their order in
  \`artworkIDs\`, and don't re-sort or filter them by price or medium unless
  the collector asked.
- \`trendingSearches\` is the *only* popularity ranking in the
  schema, and it is a real one — computed daily from what people actually
  search for and view. \`artworksConnection\` has no trending/popular sort, so
  never answer a "what's popular" question by sorting on recency and never say
  Artsy has no trending data. \`period\` is \`ONE_DAY\`, \`SEVEN_DAYS\` or
  \`THIRTY_DAYS\` (default \`ONE_DAY\`); prefer \`SEVEN_DAYS\` unless the user
  asked specifically about today. The ranking is global — it takes no artist,
  medium or price filter, so for "trending <something specific>" say the
  ranking is site-wide before narrowing another way.
- Saves: an artist's own \`artworksConnection\` takes a real sort enum,
  including \`RECENT_SAVES_COUNT_DESC\` (most saved in the last 30 days), so
  \`artist(id: "<slug>") { artworksConnection(sort: RECENT_SAVES_COUNT_DESC, first: <=20) { edges { node { internalID slug title recentSavesCount } } } }\`
  answers "most saved works by <artist>". The site-wide \`artworksConnection\`
  takes \`sort\` as a plain string with no saves ranking, so "most saved on
  Artsy" overall is not answerable — offer trending, or the same question
  scoped to an artist.
- \`trendingSearches\` returns ranked wrappers, not artworks: the \`internalID\` you cite
  must come from the nested \`artwork { internalID }\`, and results are already
  in rank order, so keep that order in \`artworkIDs\`.
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

// An answer's `message` never names the works it showed, so without this a
// follow-up like "the second one" has nothing to resolve against. Capped then
// filtered, matching resolveArtworks.
function annotateWithShownArtworks(
  content: string,
  artworkIDs: readonly string[]
): string {
  const shown = artworkIDs
    .slice(0, MAX_ARTWORK_IDS)
    .filter((id) => INTERNAL_ID.test(id))
  if (shown.length === 0) return content

  const note =
    "[Cards shown to the collector with this answer, in display order: " +
    `${shown.map((id, index) => `${index + 1}. ${id}`).join(" ")} — they see ` +
    "images, not these ids.]"

  return content.length > 0 ? `${content}\n\n${note}` : note
}

function buildMessages(
  history: AIAgentHistoryEntry[] | null | undefined,
  message: string
): ModelMessage[] {
  const priorMessages: ModelMessage[] = (history ?? []).map((entry) =>
    entry.role === "assistant"
      ? {
          role: "assistant",
          content: annotateWithShownArtworks(
            entry.content,
            entry.artworkIDs ?? []
          ),
        }
      : { role: "user", content: entry.content }
  )

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
  input: {
    conversationID: string
    message: string
    history?: AIAgentHistoryEntry[] | null
  },
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
