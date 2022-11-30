import { isExisty } from "lib/helpers"
import date from "schema/v2/fields/date"
import initials from "schema/v2/fields/initials"
import { get, merge } from "lodash"
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ArtworkType } from "schema/v2/artwork"
import { ShowType } from "schema/v2/show"
import {
  GlobalIDField,
  NodeInterface,
  InternalIDFields,
  NullableIDField,
} from "schema/v2/object_identification"
import { MessageType } from "./message"
import { ResolverContext } from "types/graphql"
import { UserType } from "../user"

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

export const ConversationInitiatorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationInitiator",
  description:
    "The participant who started the conversation, currently always a User",
  fields: {
    ...InternalIDFields,
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

export const ConversationResponderType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationResponder",
  description:
    "The participant responding to the conversation, currently always a Partner",
  fields: {
    ...InternalIDFields,
    type: {
      description: "The type of participant, e.g. Partner or User",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    replyToImpulseIDs: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description:
        "An array of Impulse IDs that correspond to all email addresses that messages should be sent to",
      resolve: ({ reply_to_impulse_ids }) => reply_to_impulse_ids,
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

const ConversationItem = new GraphQLObjectType<any, ResolverContext>({
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
    liveArtwork: {
      type: ConversationItemType,
      description: "The actual, non-snapshotted artwork",
      resolve: async (conversationItem, _args, { artworkLoader }) => {
        if (conversationItem.item_type === "Artwork") {
          try {
            const artworkData = await artworkLoader(
              conversationItem.properties.id
            )
            return {
              ...artworkData,
              __typename: "Artwork",
            }
          } catch (error) {
            console.error(error)
            return null
          }
        } else if (conversationItem.item_type === "PartnerShow") {
          console.warn("PartnerShow not supported")
          return null
        } else {
          return null
        }
      },
    },
  },
})

export const {
  connectionType: MessageConnection,
  edgeType: MessageEdge,
} = connectionDefinitions({
  nodeType: MessageType,
  connectionFields: {
    totalCount: {
      resolve: ({ total_count }) => total_count,
      type: GraphQLInt,
    },
  },
})

const isLastMessageToUser = ({ _embedded, from_email }) => {
  const lastMessageFromEmail = get(_embedded, "last_message.from_email_address")
  const lastMessagePrincipal = get(_embedded, "last_message.from_principal")
  return lastMessagePrincipal === false || from_email !== lastMessageFromEmail
}

const lastMessageId = (conversation) => {
  return get(conversation, "_embedded.last_message.id")
}

// TODO: Move back inside ConversationType after messages is removed
const messagesConnection = {
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
    { id, from_email, initial_message, from_name, _embedded },
    options,
    { conversationMessagesLoader }: { conversationMessagesLoader?: any }
  ) => {
    if (!conversationMessagesLoader) return null
    const optionKeys = Object.keys(options)
    if (optionKeys.includes("last") && !optionKeys.includes("before")) {
      options.before = `${lastMessageId({ _embedded })}`
    }
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
      message_details = message_details.map((message) => {
        return merge(message, {
          conversation_initial_message: initial_message,
          conversation_from_name: from_name,
          conversation_from_address: from_email,
          conversation_id: id,
        })
      })
      return {
        ...connectionFromArraySlice(message_details, options, {
          arrayLength: total_count,
          sliceStart: offset,
        }),
        total_count,
      }
    })
  },
}
export const ConversationType = new GraphQLObjectType<any, ResolverContext>({
  name: "Conversation",
  description: "A conversation.",
  interfaces: [NodeInterface],
  fields: {
    id: GlobalIDField,
    ...NullableIDField,
    inquiryID: {
      description: "Gravity inquiry id.",
      type: GraphQLString,
      resolve: ({ inquiry_id }) => {
        return inquiry_id
      },
    },
    from: {
      description: "The participant who initiated the conversation",
      type: new GraphQLNonNull(ConversationInitiatorType),
      resolve: (conversation) => {
        return {
          id: conversation.from_id,
          type: conversation.from_type,
          name: conversation.from_name,
          email: conversation.from_email,
        }
      },
    },
    fromUser: {
      description: "The user who initiated the conversation",
      type: UserType,
      resolve: ({ from_id }, _options, { userByIDLoader }) => {
        if (!userByIDLoader) {
          return null
        }

        return userByIDLoader(from_id)
      },
    },
    to: {
      description: "The participant(s) responding to the conversation",
      type: new GraphQLNonNull(ConversationResponderType),
      resolve: (conversation) => {
        return {
          id: conversation.to_id,
          type: conversation.to_type,
          name: conversation.to_name,
          reply_to_impulse_ids: conversation.to,
        }
      },
    },
    buyerOutcome: {
      type: GraphQLString,
      resolve: ({ buyer_outcome }) => buyer_outcome,
    },
    buyerOutcomeAt: date,
    createdAt: date,
    fromLastViewedMessageID: {
      type: GraphQLString,
      resolve: ({ from_last_viewed_message_id }) => from_last_viewed_message_id,
    },
    initialMessage: {
      deprecationReason:
        "This field is no longer required. Prefer the first message from the MessageConnection.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ initial_message }) => {
        if (!initial_message) return ""
        return initial_message
      },
    },
    lastMessage: {
      type: GraphQLString,
      description: "This is a snippet of text from the last message.",
      resolve: ({ initial_message, _embedded = {} }) => {
        const lastMessage = _embedded.last_message || {}
        if (lastMessage.order == 1) {
          return initial_message
        }
        return lastMessage.snippet
      },
    },
    lastMessageAt: date,

    lastMessageID: {
      type: GraphQLString,
      deprecationReason:
        "Prefer querying `messagesConnection(last:1) { edges { node { internalID } } }`",
      description: "Impulse id of the last message.",
      resolve: (conversation) => lastMessageId(conversation),
    },

    // TODO: Currently if the user is not the sender of a message, we assume they are a recipient.
    // That may not be the case, so we should evolve this check to be more accurate.
    isLastMessageToUser: {
      type: GraphQLBoolean,
      description: "True if user/conversation initiator is a recipient.",
      resolve: (conversation) => isLastMessageToUser(conversation),
    },

    // If the user is a recipient of the last message, return the relevant delivery id.
    // This can be used to mark the message as read, or log other events.
    lastMessageDeliveryID: {
      type: GraphQLString,
      description:
        "Delivery id if the user is a recipient of the last message, null otherwise.",
      resolve: (conversation, _options, { conversationMessagesLoader }) => {
        if (!conversationMessagesLoader || !isLastMessageToUser(conversation)) {
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
            (d) => d.email === conversation.from_email
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
      resolve: (conversation) => {
        const results = []
        for (const item of conversation.items) {
          if (item.item_type === "Artwork") {
            // FIXME: Argument of type 'any' is not assignable to parameter of type 'never'.
            // @ts-ignore
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
      resolve: (conversation) => {
        const results = []

        for (const item of conversation.items) {
          if (
            isExisty(item.properties) &&
            (item.item_type === "Artwork" || item.item_type === "PartnerShow")
          ) {
            // FIXME: Argument of type 'any' is not assignable to parameter of type 'never'.
            // @ts-ignore
            results.push(item)
          }
        }
        return results
      },
    },

    messages: {
      ...messagesConnection,
      deprecationReason: "Prefer messagesConnection",
    },

    messagesConnection,
    unread: {
      type: GraphQLBoolean,
      description: "True if there is an unread message by the user.",
      resolve: (conversation) => {
        const memoizedLastMessageId = lastMessageId(conversation)
        const { from_last_viewed_message_id } = conversation
        return (
          !!from_last_viewed_message_id &&
          !!memoizedLastMessageId &&
          from_last_viewed_message_id < memoizedLastMessageId
        )
      },
    },
  },
})

const Conversation: GraphQLFieldConfig<void, ResolverContext> = {
  type: ConversationType,
  description: "A conversation, usually between a user and a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
  },
  resolve: (_root, { id }, { conversationLoader }) => {
    return conversationLoader ? conversationLoader(id) : null
  },
}

export default Conversation
