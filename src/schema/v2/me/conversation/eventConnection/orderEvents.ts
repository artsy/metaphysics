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
import { PaginatedFetcher } from "./combinedPagination"

// Fetch all events for conversation because we will need them no matter what
// todo: mode into orderEvents
export const fetchOrderEventsForPagination = (
  conversationId: any,
  userID: string,
  exchangeGraphQLLoader: any
): PaginatedFetcher => async (limit, offset, sort) => {
  console.log("FetchOrderEvents", { limit, offset, conversationId })

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
                exchangeType: __typename
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
  const orderEvents = exchangeData.orders.nodes.flatMap(
    (node) => node.orderHistory
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
  resolveType: (value) => {
    // debugger
    const { exchangeType } = value
    if (!exchangeType) {
      return "Message"
    }
    console.log(exchangeType)
    switch (exchangeType) {
      case "OrderStateChangedEvent":
        return "ConversationOrderStateChanged"
      case "OfferSubmittedEvent":
        return "ConversationOfferSubmitted"
      default:
        return "Message"
    }
  },
})
