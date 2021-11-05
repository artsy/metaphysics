import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLUnionType,
} from "graphql"
import date from "schema/v2/fields/date"
import { MessageType } from "schema/v2/me/conversation/message"
import { NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { FetcherForLimitAndOffset } from "./hybridConnection/fetchHybridConnection"

// Fetch all events for conversation because we will need them no matter what
// todo: mode into orderEvents
export const fetchOrderEventsForPagination = (
  conversationId: any,
  userID: string,
  exchangeGraphQLLoader: any
): FetcherForLimitAndOffset => async (limit, offset, sort) => {
  const orderEvents: Array<any> = await fetchOrderEvents(conversationId, {
    exchangeGraphQLLoader,
    userID,
  })
  const sortedNodes = orderEvents.sort((event) => {
    const date: number = Date.parse(event.createdAt)

    return sort === "DESC" ? -date : date
  })

  return {
    totalCount: sortedNodes.length,
    nodes: sortedNodes.slice(offset, limit + offset),
  }
}

const fakeEventId = (prefix, index) => `${prefix}-event-${index}`

/**
 * fetch all order events for a conversation from exchange
 */
const fetchOrderEvents = async (
  conversationId: string,
  // from ctx
  {
    exchangeGraphQLLoader,
    userID,
  }: { exchangeGraphQLLoader: any; userID: string },
  // from args - presence of sellerId overrides buyer mode
  sellerId?: string
) => {
  if (!exchangeGraphQLLoader) return null
  // this id key depends on whether the requester the buyer or seller
  const viewerKey = sellerId
    ? `sellerId: "${sellerId}"`
    : `buyerId: "${userID}"`

  const exchangeData = await exchangeGraphQLLoader({
    query: gql`
      query ConversationEventConnection($conversationId: String!) {
        orders(first: 100, impulseConversationId: $conversationId, ${viewerKey}) {
          totalCount
          nodes {
              orderHistory {
                context_type: __typename
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
  const orderEvents = exchangeData.orders.nodes.flatMap((node) =>
    node.orderHistory.map((event, index) => {
      return { ...event, id: fakeEventId(conversationId, index) }
    })
  )
  return orderEvents
}

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

export const ConversationEventUnion = new GraphQLUnionType({
  name: "ConversationEvent",
  types: [
    MessageType,
    ConversationOfferSubmittedEventType,
    ConversationOrderStateChangedType,
  ],
  resolveType: (value, ..._args) => {
    switch (value.context_type) {
      case "Message":
        return MessageType
      case "OrderStateChangedEvent":
        return ConversationOrderStateChangedType
      case "OfferSubmittedEvent":
        return ConversationOfferSubmittedEventType
      default:
        throw new Error(`Unknown context type: ${value.context_type}`)
    }
  },
})
