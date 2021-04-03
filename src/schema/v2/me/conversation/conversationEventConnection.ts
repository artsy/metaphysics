import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
// import { connectionWithCursorInfo } from "../fields/pagination"
// import { Lot } from "../lot"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { MessageType } from "./message"
import { NodeInterface } from "schema/v2/object_identification"
import date from "schema/v2/fields/date"
import { get, merge, sortBy } from "lodash"
// interface ConversationOrderEvent {
//   id: string
//   createdAt: string
//   __typename: "CommerceOrderStateChangedEvent" | "CommerceOfferSubmittedEvent"
// }

const orderEventStub = [
  {
    __typename: "CommerceOrderStateChangedEvent",
    createdAt: "2021-04-01T13:26:53Z",
    state: "PENDING",
    stateReason: null,
  },
  {
    __typename: "CommerceOrderStateChangedEvent",
    createdAt: "2021-04-02T15:15:00Z",
    state: "SUBMITTED",
    stateReason: null,
  },
  {
    __typename: "CommerceOfferSubmittedEvent",
    createdAt: "2021-04-02T15:15:00Z",
    offer: {
      respondsTo: null,
      amount: "$2,730",
      fromParticipant: "BUYER",
    },
  },
]

interface ExchangeOfferSubmittedEvent {
  respondTo: null | {
    fromParticipant: "BUYER" | "SELLER"
  }
  amount: string
  createdAt: any
}

const ConversationOfferReceivedEventType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationOfferSubmitted",
  interfaces: [NodeInterface],
  description: "An offer submitted in a conversation",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    createdAt: date,
    amount: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ offer }) => offer.amount,
    },
    fromParticipant: {
      type: new GraphQLEnumType({
        name: "ConversationOfferPartyType",
        values: {
          BUYER: { value: "BUYER" },
          SELLER: { value: "SELLER" },
        },
      }),
    },
    isCounter: {
      type: GraphQLBoolean,
      resolve: ({ respondTo }) => Boolean(respondTo),
    },
  },
})

const ConversationOrderStateChangedType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationOrderStateChanged",
  interfaces: [NodeInterface],
  description: "A conversation order state change",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    createdAt: date,
    state: { type: new GraphQLNonNull(GraphQLString) },
    stateReason: { type: GraphQLString },
  },
})

const ConversationEventType = new GraphQLUnionType({
  name: "ConversationEvent",
  types: [
    MessageType,
    ConversationOfferReceivedEventType,
    ConversationOrderStateChangedType,
  ],
  resolveType: (value) => {
    // debugger
    const { __typename } = value
    switch (__typename) {
      case "CommerceOrderStateChangedEvent":
        return "ConversationOrderStateChanged"
      case "CommerceOfferSubmittedEvent":
        return "ConversationOfferSubmitted"
      default:
        return "Message"
    }
  },
})

const lastMessageId = (conversation) => {
  return get(conversation, "_embedded.last_message.id")
}

export const conversationEventConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Messages and other events in a conversation.",
  type: connectionWithCursorInfo({
    nodeType: ConversationEventType,
  }).connectionType,
  args: pageable({
    sort: {
      type: new GraphQLEnumType({
        name: "sortMessages",
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
      const messages = message_details.map((message) => {
        return merge(message, {
          conversation_initial_message: initial_message,
          conversation_from_name: from_name,
          conversation_from_address: from_email,
          conversation_id: id,
        })
      })
      const orderEvents = orderEventStub.map((event, index) => {
        return { ...event, id: `event-${index}` }
      })
      const conversationEvents = sortBy(
        [...messages, ...orderEvents],
        (event) => new Date(event.createdAt!)
      )
      debugger
      return {
        ...connectionFromArraySlice(conversationEvents, options, {
          arrayLength: total_count + orderEvents.length,
          sliceStart: offset,
        }),
        totalCount: total_count + orderEvents.length,
      }
    })
  },
}
