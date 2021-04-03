import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArraySlice } from "graphql-relay"
// import { connectionWithCursorInfo } from "../fields/pagination"
// import { Lot } from "../lot"
import {
  graphql,
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
import gql from "lib/gql"
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

const ConversationOfferSubmittedEventType = new GraphQLObjectType<
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
      resolve: ({ offer }) => offer.amountCents,
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
    ConversationOfferSubmittedEventType,
    ConversationOrderStateChangedType,
  ],
  resolveType: (value) => {
    // debugger
    const { __typename } = value
    console.log(__typename)
    switch (__typename) {
      case "OrderStateChangedEvent":
        return "ConversationOrderStateChanged"
      case "OfferSubmittedEvent":
        return "ConversationOfferSubmitted"
      default:
        return "Message"
    }
  },
})

const lastMessageId = (conversation) => {
  return get(conversation, "_embedded.last_message.id")
}

const fetchMessagesForConversation = (
  conversationId: string,
  // from ctx
  { exchangeLoader, userID }: { exchangeLoader?: any; userID?: string },
  // from args - presence of sellerId overrides buyer mode
  { sellerId }: { sellerId?: string }
) => {
  if (!exchangeLoader) return null
  // this id changes for the buyer or seller
  const viewerKey = sellerId
    ? `sellerId: "${sellerId}"`
    : `buyerId: "${userID}"`

  return exchangeLoader({
    query: gql`
      query ConversationEventConnection($conversationId: String!) {
        orders(first: 100, impulseConversationId: $conversationId, ${viewerKey}) {
          totalCount
          nodes {
              orderHistory {
                __typename
                ... on OrderStateChangedEvent {
                  createdAt
                  state
                  stateReason
                }
                ... on OfferSubmittedEvent {
                  createdAt
                  offer {
                    internalID
                    # perhaps stitch these pieces in so we can get proper money conversions
                    amountCents
                    fromParticipant
                    definesTotal
                    offerAmountChanged
                    respondsTo {
                      fromParticipant
                    }
                  }
                }
              }
          }
        }
      }
    `,
    variables: {
      conversationId: String(conversationId),
    },
  })
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
    ctx: {
      conversationMessagesLoader?: any
      exchangeLoader?: any
      userID?: string
    }
  ) => {
    const { conversationMessagesLoader } = ctx
    if (!conversationMessagesLoader) return null
    const optionKeys = Object.keys(options)
    if (optionKeys.includes("last") && !optionKeys.includes("before")) {
      options.before = `${lastMessageId({ _embedded })}`
    }

    // TODO: make paging work
    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)

    const orderEventRequest = fetchMessagesForConversation(id, ctx, {})

    const messagesRequest = conversationMessagesLoader({
      page,
      size,
      conversation_id: id,
      "expand[]": "deliveries",
      sort: options.sort || "asc",
    })

    return Promise.all([orderEventRequest, messagesRequest]).then(
      ([orderEventResponse, { total_count, message_details }]) => {
        // Inject the convesation initiator's email into each message payload
        // so we can tell if the user sent a particular message.
        // Also inject the conversation id, since we need it in some message
        // resolvers (invoices).
        /* eslint-disable no-param-reassign */
        const messages = message_details.map((message) => {
          return merge(message, {
            createdAt: message.created_at,
            conversation_initial_message: initial_message,
            conversation_from_name: from_name,
            conversation_from_address: from_email,
            conversation_id: id,
          })
        })

        // console.log("**********")
        // console.log(orderEventResponse)
        // console.log("**********")

        const orderEvents = orderEventResponse.orders.nodes.flatMap(
          (node) => node.orderHistory
        )
        // console.log({ offset })

        const orderEventNodes = orderEvents.map((event, index) => {
          return { ...event, id: `event-${index}` }
        })

        const allConversationEvents = sortBy(
          [...messages, ...orderEventNodes],
          (event) => {
            new Date(event.createdAt!)
            return new Date(event.createdAt!)
          }
        )
        const combinedLength = total_count + orderEventNodes.length
        const x = connectionFromArraySlice(allConversationEvents, options, {
          arrayLength: combinedLength,
          sliceStart: offset,
        })
        console.log(x)
        return {
          ...connectionFromArraySlice(allConversationEvents, options, {
            arrayLength: combinedLength,
            sliceStart: offset,
          }),
          totalCount: combinedLength,
        }
      }
    )
  },
}
