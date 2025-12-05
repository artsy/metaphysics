import { isExisty } from "lib/helpers"
import date, { date as dateField } from "schema/v2/fields/date"
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
import { InquiryRequestType } from "../partner/partnerInquiryRequest"
import { CollectorProfileType } from "../CollectorProfile/collectorProfile"
import { ConversationEventType } from "./conversationEvent"
import {
  connectionWithCursorInfo,
  createPageCursors,
  paginationResolver,
} from "../fields/pagination"
import { CollectorResume } from "./collectorResume"
import { UserInterestConnection } from "../userInterests"

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
      resolve: ({ name }) => name || "Artsy User", // users may lack names, so fall back this non-null field
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

const MessageOrConversationEventType = new GraphQLUnionType({
  name: "MessageOrConversationEventType",
  types: [MessageType, ConversationEventType],
  resolveType: ({ type }) => {
    switch (type) {
      case "message_detail":
        return MessageType
      case "conversation_event":
        return ConversationEventType
      default:
        return null
    }
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
      // resolvers.
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
  fields: () => {
    // Dynamically require to avoid circular dependency
    const {
      ConversationOrdersConnectionType,
    } = require("../order/types/OrderType")

    return {
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
      collectorResume: {
        description:
          "The collector profile of the user who initiated the conversation. Do not use this field for Partners",
        type: CollectorResume,
        resolve: async (
          { from_id, to_id, items },
          _args,
          { partnerCollectorProfileLoader }
        ) => {
          if (!partnerCollectorProfileLoader) return

          try {
            const data = await partnerCollectorProfileLoader({
              partnerId: to_id,
              userId: from_id,
            })

            // Assume a conversation only has one item
            const artwork = items.find((item) => item.item_type === "Artwork")
            const artworkID = artwork ? artwork.properties.id : null

            return {
              collectorProfile: {
                ...data.collector_profile,
                // inject data that can be optionally used by
                // collectorProfile fields to resolve
                partnerId: to_id,
                artworkID,
              },
              isCollectorFollowingPartner: data.follows_profile,
              userId: from_id,
              purchases: data.purchases,
            }
          } catch (error) {
            console.error(
              "[schema/v2/conversation/collectorResume] Error:",
              error
            )
            return null
          }
        },
      },
      collectorInterestsConnection: {
        type: UserInterestConnection,
        args: pageable({}),
        resolve: async (
          { from_id, to_id },
          args,
          {
            partnerCollectorProfileUserInterestsLoader,
            partnerCollectorProfileLoader,
          }
        ) => {
          if (
            !partnerCollectorProfileUserInterestsLoader ||
            !partnerCollectorProfileLoader ||
            !from_id ||
            !to_id
          ) {
            return null
          }

          try {
            const { page, size, offset } = convertConnectionArgsToGravityArgs(
              args
            )
            const data = await partnerCollectorProfileLoader({
              partnerId: to_id,
              userId: from_id,
            })
            const {
              body,
              headers,
            } = await partnerCollectorProfileUserInterestsLoader(
              {
                collectorProfileId: data.collector_profile.id,
                partnerId: to_id,
              },
              {
                page,
                size,
                total_count: true,
              }
            )
            const totalCount = parseInt(headers["x-total-count"] || "0", 10)

            return {
              totalCount,
              pageCursors: createPageCursors({ page, size }, totalCount),
              ...connectionFromArraySlice(body, args, {
                arrayLength: totalCount,
                sliceStart: offset,
                resolveNode: (node) => node.interest,
              }),
            }
          } catch (error) {
            console.error(
              "[schema/v2/conversation#collectorInterestsConnection] Error:",
              error
            )
            return null
          }
        },
      },
      fromProfile: {
        description:
          "The collector profile of the user who initiated the conversation",
        type: CollectorProfileType,
        deprecationReason: "Use `collectorResume` instead",
        resolve: async ({ from_id }, _options, { collectorProfilesLoader }) => {
          if (!collectorProfilesLoader)
            throw new Error(
              "A X-Access-Token header is required to perform this action."
            )

          const { body: profiles } = await collectorProfilesLoader({
            user_id: from_id,
          })

          return profiles[0]
        },
      },
      fromUser: {
        description: "The user who initiated the conversation",
        type: UserType,
        deprecationReason:
          "Will be inaccessible to partners in future versions. Prefer fromProfile.",
        resolve: async ({ from_id }, _options, { userByIDLoader }) => {
          if (!userByIDLoader) {
            return null
          }
          try {
            const user = await userByIDLoader(from_id)
            return user
          } catch (error) {
            console.error("[schema/v2/conversation/fromUser] Error:", error)
            return null
          }
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
      deletedAt: date,
      dismissedAt: date,
      fromLastViewedMessageID: {
        type: GraphQLString,
        resolve: ({ from_last_viewed_message_id }) =>
          from_last_viewed_message_id,
      },
      fromLastViewedMessageAt: dateField(),
      toLastViewedMessageID: {
        type: GraphQLString,
        resolve: ({ to_last_viewed_message_id }) => {
          return to_last_viewed_message_id
        },
      },
      toLastViewedMessageAt: dateField(),
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

      artworks: {
        type: new GraphQLList(ArtworkType),
        description: "Only the artworks discussed in the conversation.",
        resolve: (conversation) => {
          const items: any[] = conversation.items || []
          return items
            .filter(
              (item) => item && item.item_type === "Artwork" && item.properties
            )
            .map((item) => item.properties)
        },
      },
      inquiryRequest: {
        type: InquiryRequestType,
        description: "The inquiry request associated with the conversation.",
        resolve: async (
          conversation,
          _args,
          { partnerInquiryRequestLoader }
        ) => {
          if (!partnerInquiryRequestLoader) {
            return null
          }
          try {
            const data = await partnerInquiryRequestLoader({
              inquiryId: conversation.inquiry_id,
              partnerId: conversation.to_id,
            })
            return data
          } catch (error) {
            console.error(
              "[schema/v2/conversation/inquiryRequest] Error:",
              error
            )
            return null
          }
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

      messagesAndConversationEventsConnection: {
        type: connectionWithCursorInfo({
          nodeType: MessageOrConversationEventType,
        }).connectionType,
        description:
          "A connection for all messages and events in a single conversation",
        args: pageable({
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        resolve: async (
          { id, from_email, initial_message, from_name, embedded },
          args,
          { conversationWithEventsLoader }
        ) => {
          if (!conversationWithEventsLoader) return null

          const argKeys = Object.keys(args)
          if (argKeys.includes("last") && !argKeys.includes("before")) {
            args.before = `${lastMessageId({ embedded })}`
          }

          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { body } = await conversationWithEventsLoader(id, {
            page,
            size,
          })

          // Inject the convesation initiator's email into each message payload
          // so we can tell if the user sent a particular message.
          // Also inject the conversation id, since we need it in some message
          // resolvers.
          const messagesAndEvents = body.messages_and_conversation_events.map(
            (messageOrEvent) => {
              if (messageOrEvent.type === "message_detail") {
                return merge(messageOrEvent, {
                  conversation_initial_message: initial_message,
                  conversation_from_name: from_name,
                  conversation_from_address: from_email,
                  conversation_id: id,
                })
              } else {
                return messageOrEvent
              }
            }
          )

          return paginationResolver({
            args,
            body: messagesAndEvents,
            offset,
            page,
            size,
            totalCount: body.total_count,
          })
        },
      },
      unread: {
        type: GraphQLBoolean,
        description:
          "True if there is an unread message by the Collector(from).",
        deprecationReason: "Use `unreadByCollector` instead",
        resolve: (conversation) => {
          return conversation.is_unread_by_collector
        },
      },
      unreadByCollector: {
        type: GraphQLBoolean,
        description:
          "True if there is an unread message by the Collector(from).",
        resolve: (conversation) => {
          return conversation.is_unread_by_collector
        },
      },
      unreadByPartner: {
        type: GraphQLBoolean,
        description: "True if there is an unread message by the Partner(to).",
        resolve: (conversation) => {
          return conversation.is_unread_by_partner
        },
      },
      collectorOrdersConnection: {
        type: ConversationOrdersConnectionType,
        description:
          "A connection of orders for artworks in this conversation from the collector's perspective.",
        args: pageable({
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        resolve: async (conversation, args, context, _info) => {
          const { meOrdersLoader } = context
          if (!meOrdersLoader) return null

          return fetchConversationOrders(meOrdersLoader, conversation, args)
        },
      },
      partnerOrdersConnection: {
        type: ConversationOrdersConnectionType,
        description:
          "A connection of orders for artworks in this conversation from the partner's perspective.",
        args: pageable({
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
          partnerID: {
            type: new GraphQLNonNull(GraphQLString),
            description: "Partner ID to fetch orders for",
          },
        }),
        resolve: async (conversation, args, context, _info) => {
          const { partnerID } = args
          const buyerID = conversation.from_id
          const { partnerOrdersLoader } = context
          if (!partnerOrdersLoader) return null

          if (!buyerID) {
            // Conversation has no buyer ID, cannot proceed for a partner-authed query
            return null
          }

          const partnerOrdersLoaderForPartner = (params) =>
            partnerOrdersLoader(partnerID, { ...params, buyer_id: buyerID })

          return fetchConversationOrders(
            partnerOrdersLoaderForPartner,
            conversation,
            args
          )
        },
      },
    }
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

const fetchConversationOrders = async (loader, conversation, args) => {
  const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

  // Get artwork IDs from conversation items
  const artworkIds: string[] = []
  for (const item of conversation.items) {
    if (item.item_type === "Artwork") {
      artworkIds.push(item.properties.id)
    }
  }

  // If no artworks in conversation, return empty connection
  if (artworkIds.length === 0) {
    return paginationResolver({
      totalCount: 0,
      offset,
      page,
      size,
      body: [],
      args,
    })
  }

  const params: Record<string, any> = {
    page,
    size,
    artwork_id: artworkIds[0], // Use first artwork ID for filtering
  }

  const response = await loader(params)

  const { body, headers } = response
  const totalCount = parseInt((headers ?? {})["x-total-count"] || "0", 10)

  return paginationResolver({
    totalCount,
    offset,
    page,
    size,
    body,
    args,
  })
}
