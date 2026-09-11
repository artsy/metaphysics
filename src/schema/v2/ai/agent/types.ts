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

export const AIAgentMessageInputType = new GraphQLInputObjectType({
  name: "AIAgentMessageInput",
  fields: {
    role: { type: new GraphQLNonNull(AIAgentRoleType) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    artworkIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
  },
})

export interface AIAgentHistoryEntry {
  role: string
  content: string
  artworkIDs?: string[] | null
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
    includeDebugToolCalls: {
      type: GraphQLBoolean,
      description:
        "Include developer-facing tool-call details. Available only in development.",
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

export interface AIAgentTurnCompletePayload {
  __typename: "AIAgentTurnComplete"
  message: string | null
  // Raw Gravity artwork hashes (from artworksLoader), not a bespoke shape --
  // resolved server-side from the model's artworkIDs so display data is
  // loader-verified rather than model-transcribed. Same shape ArtworkType's
  // own resolvers expect elsewhere in the schema.
  artworks: any[] | null
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
        "Developer-facing tool arguments, populated only when development debug mode is enabled.",
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
        "Developer-facing failure detail, populated only when development debug mode is enabled.",
    },
  },
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
      description: "Artworks referenced in the answer, for rendering as cards.",
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
