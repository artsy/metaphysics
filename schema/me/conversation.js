import date from "fields/date"
import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { get } from "lodash"
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLEnumType } from "graphql"
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
      type: GraphQLString,
    },
    from_email_address: {
      description: "Email address of sender.",
      type: GraphQLString,
    },
    snippet: {
      description: "A snippet of the full message",
      type: GraphQLString,
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
  from_id: {
    type: new GraphQLNonNull(GraphQLString),
  },
  from_type: {
    type: new GraphQLNonNull(GraphQLString),
  },
  from_name: {
    type: new GraphQLNonNull(GraphQLString),
  },
  from_email: {
    type: new GraphQLNonNull(GraphQLString),
  },
  to_id: {
    type: new GraphQLNonNull(GraphQLString),
  },
  to_type: {
    type: new GraphQLNonNull(GraphQLString),
  },
  to_name: {
    type: new GraphQLNonNull(GraphQLString),
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
    type: GraphQLString,
  },
  last_message: {
    type: GraphQLString,
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
    type: new GraphQLList(MessageType),
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
        return impulse
          .with(data.token, { method: "GET" })(`conversations/${id}`, {
            expand: ["messages"],
          })
          .then(impulseData => {
            return impulseData
          })
      })
  },
}
