import date from "../fields/date"
import impulse from "../../lib/loaders/impulse"
import gravity from "../../lib/loaders/gravity"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLEnumType,
} from "graphql"
import { ArtworkType } from "../artwork"
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
      if (conversation._embedded.last_message) {
        return conversation._embedded.last_message.snipped
      }
      return null
    },
  },
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
}

export const ConversationType = new GraphQLObjectType({
  name: "ConversationType",
  description: "A conversation.",
  fields: ConversationFields,
})

export default {
  type: new GraphQLList(ConversationType),
  decription: "Conversations, usually between a user and partner.",
  args: {
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (root, option, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return null

    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return impulse
          .with(data.token)("conversations", {
            from_id: userID,
            from_type: "User",
          })
          .then(a => a.conversations)
      })
  },
}
