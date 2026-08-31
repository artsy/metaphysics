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
  summary: string | null
}

export interface AIAgentToolResultPayload {
  __typename: "AIAgentToolResult"
  toolName: string
  ok: boolean
  summary: string | null
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
    summary: {
      type: GraphQLString,
      description: 'Human-readable label, e.g. "Searching artists…".',
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
