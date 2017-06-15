import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import date from "schema/fields/date"
import { get } from "lodash"
import { queryContainsField } from "lib/helpers"
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLEnumType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"
import { ArtworkType } from "schema/artwork"
const { IMPULSE_APPLICATION_ID } = process.env

export const BuyerOutcomeTypes = new GraphQLEnumType({
  name: "BuyerOutcomeTypes",
  values: {
    PURCHASED: {
      value: "purchased",
    },
    STILL_CONSIDERING: {
      value: "still_considering",
    },
    HIGH_PRICE: {
      value: "high_price",
    },
    LOST_INTEREST: {
      value: "lost_interest",
    },
    WORK_UNAVAILABLE: {
      value: "work_unavailable",
    },
    OTHER: {
      value: "other",
    },
    BLANK: {
      value: "",
    },
  },
})

export const MessageType = new GraphQLObjectType({
  name: "MessageType",
  description: "A message in a conversation.",
  fields: {
    id: {
      description: "Impulse id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    from_email_address: {
      description: "Email address of sender.",
      type: new GraphQLNonNull(GraphQLString),
    },
    snippet: {
      description: "A snippet of the full message",
      type: new GraphQLNonNull(GraphQLString),
    },
    radiation_message_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const ConversationInitiatorType = new GraphQLObjectType({
  name: "ConversationInitiatorType",
  description: "The participant who started the conversation, currently always a User",
  fields: {
    id: {
      description: "Impulse id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    type: {
      description: "The type of participant, e.g. Partner or User",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const ConversationResponderType = new GraphQLObjectType({
  name: "ConversationResponderType",
  description: "The participant responding to the conversation, currently always a Partner",
  fields: {
    id: {
      description: "Impulse id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    type: {
      description: "The type of participant, e.g. Partner or User",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    reply_to_impulse_ids: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: "An array of Impulse IDs that correspond to all email addresses that messages should be sent to",
    },
  },
})

export const ConversationFields = {
  id: {
    description: "Impulse id.",
    type: GraphQLString,
  },
  inquiry_id: {
    description: "Gravity inquiry id.",
    type: GraphQLString,
  },
  from: {
    description: "The participant who initiated the conversation",
    type: new GraphQLNonNull(ConversationInitiatorType),
    resolve: conversation => {
      return {
        id: conversation.from_id,
        type: conversation.from_type,
        name: conversation.from_name,
        email: conversation.from_email,
      }
    },
  },
  to: {
    description: "The participant(s) responding to the conversation",
    type: new GraphQLNonNull(ConversationResponderType),
    resolve: conversation => {
      return {
        id: conversation.to_id,
        type: conversation.to_type,
        name: conversation.to_name,
        reply_to_impulse_ids: conversation.to,
      }
    },
  },
  buyer_outcome: {
    type: GraphQLString,
  },
  buyer_outcome_at: date,
  created_at: date,
  purchase_request: {
    type: GraphQLBoolean,
  },
  initial_message: {
    type: new GraphQLNonNull(GraphQLString),
  },
  last_message: {
    type: new GraphQLNonNull(GraphQLString),
    resolve: conversation => {
      return get(conversation, "_embedded.last_message.snippet")
    },
  },
  last_message_at: date,

  artworks: {
    type: new GraphQLList(ArtworkType),
    resolve: conversation => {
      const ids = []

      for (const item of conversation.items) {
        if (item.item_type === "Artwork") {
          ids.push(item.item_id)
        }
      }

      return gravity("artworks", { ids })
    },
  },

  messages: {
    type: connectionDefinitions({ nodeType: MessageType }).connectionType,
    description: "A connection for all messages in a single conversation",
    args: pageable(),
    resolve: ({ messages }, options) => {
      const impulseOptions = parseRelayOptions(options)
      return connectionFromArraySlice(messages, options, {
        arrayLength: messages.length,
        sliceStart: impulseOptions.offset,
      })
    },
  },
}

export const ConversationType = new GraphQLObjectType({
  name: "ConversationType",
  description: "A conversation.",
  fields: ConversationFields,
})

export default {
  type: ConversationType,
  description: "A conversation, usually between a user and a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
  },
  resolve: (root, { id }, request, { rootValue: { accessToken }, fieldNodes }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        const params = queryContainsField(fieldNodes, "messages") ? { expand: ["messages"] } : {}
        return impulse.with(data.token, { method: "GET" })(`conversations/${id}`, params).then(impulseData => {
          return impulseData
        })
      })
  },
}
