import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLUnionType,
} from "graphql"
import { date } from "schema/v2/fields/date"
import { MessageType } from "schema/v2/me/conversation/message"
import { NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { FetcherForLimitAndOffset } from "../../../fields/hybridConnection/fetchHybridConnection"
import { amount } from "schema/v1/fields/money"

type ReturnedNodeShape = any

// Fetch all events for conversation because we will need them no matter what
// todo: mode into orderEvents
export const fetchOrderEventsForPagination = (
  conversationId: any,
  userID: string,
  exchangeGraphQLLoader: any
): FetcherForLimitAndOffset<ReturnedNodeShape> => async ({
  // We don't care about these because we return the entire collection and let
  // the fetchHybridConnection worry about coalating and handling the result
  limit: _limit,
  offset: _offset,
  sort: _sort,
}) => {
  const orderEvents = await fetchOrderEvents(conversationId, {
    exchangeGraphQLLoader,
    userID,
  })

  if (!orderEvents) {
    return {
      totalCount: 0,
      nodes: [],
    }
  }

  return {
    totalCount: orderEvents.length,
    nodes: orderEvents,
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
): Promise<Array<any> | null> => {
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
                      id
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
  // Extract events and sort them descending from latest
  const orderEvents: Array<any> =
    exchangeData.orders.nodes
      .flatMap((node) => node.orderHistory.map((event) => event))
      .sort((e1, e2) => Date.parse(e2.createdAt) - Date.parse(e1.createdAt)) ||
    []

  // apply a synthetic id (for the relay node interface) to each event,
  // working back to earliest. This is to guarantee the id
  // will be as stable as possible as new events are added to the collection
  const count = orderEvents.length
  orderEvents.forEach((event, index) => {
    event["id"] = `fake-id-${conversationId}-${count - index}`
  })

  return orderEvents
}

const ConversationOfferSubmittedEventType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ConversationOfferSubmitted",
  interfaces: [NodeInterface],
  description: "An offer submitted in a conversation",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    createdAt: date(),
    amount: amount(({ offer }) => offer.amountCents),
    fromParticipant: {
      type: new GraphQLEnumType({
        name: "ConversationOfferPartyType",
        values: {
          BUYER: { value: "BUYER" },
          SELLER: { value: "SELLER" },
        },
      }),
      resolve: ({ offer }) => offer.fromParticipant,
    },
    isCounter: {
      type: GraphQLBoolean,
      resolve: ({ offer }) => Boolean(offer.respondsTo),
    },
    offerAmountChanged: {
      type: GraphQLBoolean,
      resolve: ({ offer }) => Boolean(offer.offerAmountChanged),
    },
  }),
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
    createdAt: date(),
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
