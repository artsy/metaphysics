import { isExisty } from "lib/helpers"
import date from "schema/fields/date"
import initials from "schema/fields/initials"
import { get, merge } from "lodash"
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLUnionType,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ArtworkType } from "schema/artwork"
import { ShowType } from "schema/show"
import { GlobalIDField, NodeInterface } from "schema/object_identification"
import { MessageType } from "./message"

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

export const ConversationInitiatorType = new GraphQLObjectType({
  name: "ConversationInitiator",
  description:
    "The participant who started the conversation, currently always a User",
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
    initials: initials("name"),
  },
})

export const ConversationResponderType = new GraphQLObjectType({
  name: "ConversationResponder",
  description:
    "The participant responding to the conversation, currently always a Partner",
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
      description:
        "An array of Impulse IDs that correspond to all email addresses that messages should be sent to",
    },
    initials: initials("name"),
  },
})

const ConversationItemType = new GraphQLUnionType({
  name: "ConversationItemType",
  types: [ArtworkType, ShowType],
  resolveType: ({ __typename }) => {
    switch (__typename) {
      case "Artwork":
        return ArtworkType
      case "PartnerShow":
        return ShowType
      default:
        return null
    }
  },
})

const ConversationItem = new GraphQLObjectType({
  name: "ConversationItem",
  fields: {
    item: {
      type: ConversationItemType,
      resolve: ({ item_type, properties }) => ({
        __typename: item_type,
        ...properties,
      }),
    },
    title: {
      type: GraphQLString,
    },
    permalink: {
      type: GraphQLString,
    },
  },
})

export const {
  connectionType: MessageConnection,
  edgeType: MessageEdge,
} = connectionDefinitions({
  nodeType: MessageType,
})

const isLastMessageToUser = ({ _embedded, from_email }) => {
  const lastMessageFromEmail = get(_embedded, "last_message.from_email_address")
  const lastMessagePrincipal = get(_embedded, "last_message.from_principal")
  return lastMessagePrincipal === false || from_email !== lastMessageFromEmail
}

const lastMessageId = conversation => {
  return get(conversation, "_embedded.last_message.id")
}

export const ConversationFields = {
  __id: GlobalIDField,
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
    deprecationReason:
      "Purchase requests are not supported. Replaced by buy now.",
    resolve: () => null,
  },
  from_last_viewed_message_id: {
    type: GraphQLString,
  },
  initial_message: {
    type: new GraphQLNonNull(GraphQLString),
    resolve: ({ initial_message, from_name }) => {
      const parts = initial_message.split("Message from " + from_name + ":\n\n")
      return parts[parts.length - 1]
    },
  },
  last_message: {
    type: GraphQLString,
    description: "This is a snippet of text from the last message.",
    resolve: () => null,
  },
  last_message_at: date,

  last_message_id: {
    type: GraphQLString,
    description: "Impulse id of the last message.",
    resolve: conversation => lastMessageId(conversation),
  },

  // TODO: Currently if the user is not the sender of a message, we assume they are a recipient.
  // That may not be the case, so we should evolve this check to be more accurate.
  is_last_message_to_user: {
    type: GraphQLBoolean,
    description: "True if user/conversation initiator is a recipient.",
    resolve: conversation => isLastMessageToUser(conversation),
  },

  // If the user is a recipient of the last message, return their timestamped
  // 'read' event, otherwise null.
  last_message_open: {
    deprecationReason: "Prefer to use `unread`",
    type: GraphQLString,
    description:
      "Timestamp if the user opened the last message, null in all other cases",
    resolve: (
      conversation,
      options,
      request,
      { rootValue: { conversationMessagesLoader } }
    ) => {
      if (!isLastMessageToUser(conversation)) {
        return null
      }
      const radiationMessageId = get(
        conversation,
        "_embedded.last_message.radiation_message_id"
      )
      return conversationMessagesLoader({
        conversation_id: conversation.id,
        radiation_message_id: radiationMessageId,
        "expand[]": "deliveries",
      }).then(({ message_details }) => {
        if (message_details.length === 0) {
          return null
        }
        const relevantDelivery = message_details[0].deliveries.find(
          d => d.email === conversation.from_email
        )
        if (!relevantDelivery) {
          return null
        }
        return relevantDelivery.opened_at
      })
    },
  },

  // If the user is a recipient of the last message, return the relevant delivery id.
  // This can be used to mark the message as read, or log other events.
  last_message_delivery_id: {
    type: GraphQLString,
    description:
      "Delivery id if the user is a recipient of the last message, null otherwise.",
    resolve: (
      conversation,
      options,
      request,
      { rootValue: { conversationMessagesLoader } }
    ) => {
      if (!isLastMessageToUser(conversation)) {
        return null
      }
      const radiationMessageId = get(
        conversation,
        "_embedded.last_message.radiation_message_id"
      )
      return conversationMessagesLoader({
        conversation_id: conversation.id,
        radiation_message_id: radiationMessageId,
        "expand[]": "deliveries",
      }).then(({ message_details }) => {
        if (message_details.length === 0) {
          return null
        }
        const relevantDelivery = message_details[0].deliveries.find(
          d => d.email === conversation.from_email
        )
        if (!relevantDelivery) {
          return null
        }
        return relevantDelivery.id
      })
    },
  },

  artworks: {
    type: new GraphQLList(ArtworkType),
    description: "Only the artworks discussed in the conversation.",
    resolve: conversation => {
      const results = []
      for (const item of conversation.items) {
        if (item.item_type === "Artwork") {
          results.push(item.properties)
        }
      }
      return results
    },
  },

  items: {
    type: new GraphQLList(ConversationItem),
    description:
      "The artworks and/or partner shows discussed in the conversation.",
    resolve: conversation => {
      const results = []
      for (const item of conversation.items) {
        if (
          isExisty(item.properties) &&
          (item.item_type === "Artwork" || item.item_type === "PartnerShow")
        ) {
          results.push(item)
        }
      }
      return results
    },
  },

  messages: {
    type: MessageConnection,
    description: "A connection for all messages in a single conversation",
    args: pageable({
      sort: {
        type: new GraphQLEnumType({
          name: "sort",
          values: {
            DESC: { value: "desc" },
            ASC: { value: "asc" },
          },
        }),
      },
    }),
    resolve: (
      { id, from_email },
      options,
      req,
      { rootValue: { conversationMessagesLoader } }
    ) => {
      const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
      return conversationMessagesLoader({
        page,
        size,
        conversation_id: id,
        "expand[]": "deliveries",
        sort: options.sort || "asc",
      }).then(({ total_count, message_details }) => {
        // Inject the convesation initiator's email into each message payload
        // so we can tell if the user sent a particular message.
        // Also inject the conversation id, since we need it in some message
        // resolvers (invoices).
        /* eslint-disable no-param-reassign */
        message_details = message_details.map(message => {
          return merge(message, {
            conversation_from_address: from_email,
            conversation_id: id,
          })
        })
        /* eslint-disable no-param-reassign */
        return connectionFromArraySlice(message_details, options, {
          arrayLength: total_count,
          sliceStart: offset,
        })
      })
    },
  },

  unread: {
    type: GraphQLBoolean,
    description: "True if there is an unread message by the user.",
    resolve: conversation => {
      const memoizedLastMessageId = lastMessageId(conversation)
      const { from_last_viewed_message_id } = conversation
      return (
        !!from_last_viewed_message_id &&
        !!memoizedLastMessageId &&
        from_last_viewed_message_id < memoizedLastMessageId
      )
    },
  },
}

export const ConversationType = new GraphQLObjectType({
  name: "Conversation",
  description: "A conversation.",
  interfaces: [NodeInterface],
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
  resolve: (root, { id }, request, { rootValue: { conversationLoader } }) => {
    if (!conversationLoader) return null
    return conversationLoader(id)
  },
}
