import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import date from "schema/fields/date"
import { get, merge, has } from "lodash"
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLEnumType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"
import { ArtworkType } from "schema/artwork"
const { IMPULSE_APPLICATION_ID } = process.env
import { GlobalIDField, NodeInterface } from "schema/object_identification"

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

export const AttachmentType = new GraphQLObjectType({
  name: "AttachmentType",
  desciption: "Fields of an attachment (currently from Radiation)",
  fields: {
    id: {
      description: "Attachment id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    content_type: {
      description: "Content type of file.",
      type: new GraphQLNonNull(GraphQLString),
    },
    file_name: {
      description: "File name.",
      type: new GraphQLNonNull(GraphQLString),
    },
    download_url: {
      descrpition: "URL of attachment.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const MessageType = new GraphQLObjectType({
  name: "MessageType",
  description: "A message in a conversation.",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "raw_text") && has(obj, "attachments"),
  fields: {
    __id: GlobalIDField,
    id: {
      description: "Impulse message id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    is_from_user: {
      description: "True if message is from the user to the partner.",
      type: GraphQLBoolean,
      resolve: ({ from_email_address, conversation_from_address }) => {
        return from_email_address === conversation_from_address
      },
    },
    from_email_address: {
      type: GraphQLString,
    },
    raw_text: {
      description: "Full unsanitized text.",
      type: new GraphQLNonNull(GraphQLString),
    },
    attachments: {
      type: new GraphQLList(AttachmentType),
    },
    created_at: date,
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
    resolve: ({ id, from_email }, options, req, { rootValue: { accessToken } }) => {
      const { page, size, offset } = parseRelayOptions(options)
      const impulseParams = { page, size, conversation_id: id }
      return gravity
        .with(accessToken, { method: "POST" })("me/token", {
          client_application_id: IMPULSE_APPLICATION_ID,
        })
        .then(data => {
          return impulse
            .with(data.token, { method: "GET" })(`message_details`, impulseParams)
            .then(({ total_count, message_details }) => {
              // Inject the convesation initiator's email into each message payload
              // so we can tell if the user sent a particular message.
              /* eslint-disable no-param-reassign */
              message_details = message_details.map(message => {
                return merge(message, { conversation_from_address: from_email })
              })
              /* eslint-disable no-param-reassign */
              return connectionFromArraySlice(message_details, options, {
                arrayLength: total_count,
                sliceStart: offset,
              })
            })
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
  resolve: (root, { id }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return impulse.with(data.token, { method: "GET" })(`conversations/${id}`).then(impulseData => {
          return impulseData
        })
      })
  },
}
