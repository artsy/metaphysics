import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Artwork from "schema/v2/artwork/index"

export const AIAgentRoleType = new GraphQLEnumType({
  name: "AIAgentRole",
  values: {
    USER: { value: "user" },
    ASSISTANT: { value: "assistant" },
  },
})

export const AIAgentActivityType = new GraphQLEnumType({
  name: "AIAgentActivity",
  description:
    "A stable, client-safe description of what the agent is currently doing.",
  values: {
    THINKING: {},
    SEARCHING_ARTWORKS: {},
    SEARCHING_ARTISTS: {},
    SEARCHING_SHOWS: {},
    SEARCHING_FAIRS: {},
    FINDING_RECOMMENDATIONS: {},
    LOADING_ARTWORK_DETAILS: {},
    SEARCHING_ARTSY: {},
  },
})

export type AIAgentActivity =
  | "THINKING"
  | "SEARCHING_ARTWORKS"
  | "SEARCHING_ARTISTS"
  | "SEARCHING_SHOWS"
  | "SEARCHING_FAIRS"
  | "FINDING_RECOMMENDATIONS"
  | "LOADING_ARTWORK_DETAILS"
  | "SEARCHING_ARTSY"

// GraphQL has no input unions, so a replayed section is a type tag plus ids
// rather than the concrete section types the output union uses. The enum is
// the guard: an unknown entity type fails validation on the way in.
export const AIAgentEntityTypeEnum = new GraphQLEnumType({
  name: "AIAgentEntityType",
  description: "The kind of entity a replayed section's ids refer to.",
  values: {
    ARTWORK: { value: "ARTWORK" },
  },
})

export type AIAgentEntityType = "ARTWORK"

// What a client can render, which is a different question from what a replayed
// history entry contains. The values coincide today and diverge on the first
// section type with no single entity type, so they stay separate enums.
export const AIAgentSectionTypeEnum = new GraphQLEnumType({
  name: "AIAgentSectionType",
  description: "A kind of card group an answer can attach to its prose.",
  values: {
    ARTWORKS: { value: "ARTWORKS" },
  },
})

export type AIAgentSectionType = "ARTWORKS"

/**
 * Which entity type replays a given section. Total by construction: a section
 * type added without a matching entity type would compile and then break every
 * follow-up after an answer of that kind, because the client would have no
 * legal `entityType` to send back. `null` is the deliberate answer for a
 * section that can't be replayed.
 */
export const REPLAYABLE_ENTITY_TYPE: Record<
  AIAgentSectionType,
  AIAgentEntityType | null
> = {
  ARTWORKS: "ARTWORK",
}

export const AIAgentDisplayedSectionInputType = new GraphQLInputObjectType({
  name: "AIAgentDisplayedSectionInput",
  description:
    "One group of cards an earlier answer actually showed the collector -- " +
    "not everything its prose mentioned.",
  fields: {
    entityType: { type: new GraphQLNonNull(AIAgentEntityTypeEnum) },
    internalIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "The entities' `internalID`s, in the order they were displayed.",
    },
  },
})

export const AIAgentMessageInputType = new GraphQLInputObjectType({
  name: "AIAgentMessageInput",
  fields: {
    role: { type: new GraphQLNonNull(AIAgentRoleType) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    artworkIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Superseded by `displayedSections`. Equivalent to a single ARTWORK " +
        "section; both may be sent, and ids common to the two are counted once.",
    },
    displayedSections: {
      type: new GraphQLList(
        new GraphQLNonNull(AIAgentDisplayedSectionInputType)
      ),
      description:
        "The cards this message showed, by entity type and in display " +
        'order, so a follow-up like "the second artist" has something to ' +
        "resolve against. Meaningful only on an ASSISTANT message; ignored " +
        "on a USER one. At most one section is read per message today.",
    },
  },
})

export interface AIAgentDisplayedSection {
  entityType: AIAgentEntityType
  internalIDs: string[]
}

export interface AIAgentHistoryEntry {
  role: string
  content: string
  artworkIDs?: string[] | null
  displayedSections?: AIAgentDisplayedSection[] | null
}

export const AIAgentTurnInputType = new GraphQLInputObjectType({
  name: "AIAgentTurnInput",
  fields: {
    conversationID: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "Client-generated; identifies which conversation a turn belongs to.",
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The new user message.",
    },
    history: {
      type: new GraphQLList(new GraphQLNonNull(AIAgentMessageInputType)),
      description: "Prior turns, owned and replayed by the client.",
    },
    supportedSections: {
      type: new GraphQLList(new GraphQLNonNull(AIAgentSectionTypeEnum)),
      description:
        "The section types this client can render. Defaults to " +
        "`[ARTWORKS]` when omitted, so a client that predates `sections` " +
        "keeps working off the legacy `artworks` field. Declare a type only " +
        "once you render it: the answer's prose is written on the " +
        "assumption that the cards it asked for will appear, so a section " +
        "you drop reads as a broken answer rather than a missing rail. " +
        "Keep the set constant for a build rather than varying it per turn.",
    },
    includeDebugToolCalls: {
      type: GraphQLBoolean,
      description:
        "Request developer-facing tool-call details. Honored only where the server enables debug mode; ignored elsewhere.",
    },
  },
})

// Every event payload the loop yields carries `__typename` as a discriminant
// so `AIAgentEventType.resolveType` can dispatch without per-type `isTypeOf`
// checks. Keep these shapes and the GraphQL types below in lockstep.

export interface AIAgentTextDeltaPayload {
  __typename: "AIAgentTextDelta"
  text: string
}

export interface AIAgentToolCallPayload {
  __typename: "AIAgentToolCall"
  toolName: string
  activity: AIAgentActivity
  summary: string | null
  debugSummary: string | null
}

export interface AIAgentToolResultPayload {
  __typename: "AIAgentToolResult"
  toolName: string
  ok: boolean
  summary: string | null
  debugSummary: string | null
}

// The cards attached to a finished answer: one entity type per section, in the
// order the model selected, discriminated by `__typename` like the event
// payloads above. Deliberately no presentation data (no `layout`, no
// `componentType`) -- the model chooses entities, the client chooses how they
// look.

export interface AIAgentArtworksSectionPayload {
  __typename: "AIAgentArtworksSection"
  // Raw Gravity artwork hashes, as below.
  artworks: any[]
}

// A union of one today. It exists so that the next entity type is a new
// member rather than a new shape for this field, which is what lets a client
// dispatch on `__typename` from the start.
export type AIAgentResponseSectionPayload = AIAgentArtworksSectionPayload

export interface AIAgentTurnCompletePayload {
  __typename: "AIAgentTurnComplete"
  message: string | null
  // Raw Gravity artwork hashes (from artworksLoader), not a bespoke shape --
  // resolved server-side from the model's artworkIDs so display data is
  // loader-verified rather than model-transcribed. Same shape ArtworkType's
  // own resolvers expect elsewhere in the schema.
  //
  // Superseded by `sections`: always the same works as the artworks section,
  // for clients that predate it.
  artworks: any[] | null
  sections: AIAgentResponseSectionPayload[]
  stopReason: string
  toolCallCount: number
}

export type AIAgentEventPayload =
  | AIAgentTextDeltaPayload
  | AIAgentToolCallPayload
  | AIAgentToolResultPayload
  | AIAgentTurnCompletePayload

const AIAgentTextDeltaType = new GraphQLObjectType<
  AIAgentTextDeltaPayload,
  ResolverContext
>({
  name: "AIAgentTextDelta",
  fields: {
    text: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const AIAgentToolCallType = new GraphQLObjectType<
  AIAgentToolCallPayload,
  ResolverContext
>({
  name: "AIAgentToolCall",
  fields: {
    toolName: { type: new GraphQLNonNull(GraphQLString) },
    activity: {
      type: new GraphQLNonNull(AIAgentActivityType),
      description:
        "Stable, client-safe activity for rendering localized progress UI.",
    },
    summary: {
      type: GraphQLString,
      description:
        'Generic human-readable label, e.g. "Searching for artists…".',
    },
    debugSummary: {
      type: GraphQLString,
      description:
        "Developer-facing tool arguments, populated only when debug mode is enabled.",
    },
  },
})

const AIAgentToolResultType = new GraphQLObjectType<
  AIAgentToolResultPayload,
  ResolverContext
>({
  name: "AIAgentToolResult",
  fields: {
    toolName: { type: new GraphQLNonNull(GraphQLString) },
    ok: { type: new GraphQLNonNull(GraphQLBoolean) },
    summary: { type: GraphQLString },
    debugSummary: {
      type: GraphQLString,
      description:
        "Developer-facing failure detail, populated only when debug mode is enabled.",
    },
  },
})

const AIAgentArtworksSectionType = new GraphQLObjectType<
  AIAgentArtworksSectionPayload,
  ResolverContext
>({
  name: "AIAgentArtworksSection",
  description: "Artworks to render as cards, in the order they were selected.",
  fields: {
    artworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(Artwork.type))
      ),
    },
  },
})

export const AIAgentResponseSectionType = new GraphQLUnionType({
  name: "AIAgentResponseSection",
  description:
    "A homogeneous group of entities the answer selected. Clients dispatch " +
    "on `__typename` and may safely ignore a member they don't know yet.",
  types: [AIAgentArtworksSectionType],
  resolveType: ({ __typename }: AIAgentResponseSectionPayload) => __typename,
})

const AIAgentTurnCompleteType = new GraphQLObjectType<
  AIAgentTurnCompletePayload,
  ResolverContext
>({
  name: "AIAgentTurnComplete",
  fields: {
    message: { type: GraphQLString },
    artworks: {
      type: new GraphQLList(new GraphQLNonNull(Artwork.type)),
      description:
        "Artworks referenced in the answer, for rendering as cards. " +
        "Superseded by `sections`, which also carries other entity types; " +
        "always the same works as the artworks section, for clients that " +
        "predate it.",
    },
    sections: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(AIAgentResponseSectionType))
      ),
      description:
        "The entity cards accompanying `message`, each section holding one " +
        "entity type in the order it should be displayed. Empty for a " +
        "text-only answer or a turn that produced no answer at all. " +
        "Currently at most one section per answer.",
    },
    stopReason: { type: new GraphQLNonNull(GraphQLString) },
    toolCallCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const AIAgentEventType = new GraphQLUnionType({
  name: "AIAgentEvent",
  types: [
    AIAgentTextDeltaType,
    AIAgentToolCallType,
    AIAgentToolResultType,
    AIAgentTurnCompleteType,
  ],
  resolveType: ({ __typename }: AIAgentEventPayload) => __typename,
})
