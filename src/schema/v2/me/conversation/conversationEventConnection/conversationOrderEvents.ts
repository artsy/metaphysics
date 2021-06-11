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

/**
 * fetch all order events for a conversation from exchange
 * @param conversationId
 * @param ctx
 * @param { sellerId } - to authenticate as seller instead of buyer
 * @returns
 */
export const fetchConversationOrderEvents = async (
  conversationId: string,
  // from ctx
  { exchangeLoader, userID }: { exchangeLoader?: any; userID?: string },
  // from args - presence of sellerId overrides buyer mode
  sellerId?: string
) => {
  if (!exchangeLoader) return null
  // this id changes for the buyer or seller
  const viewerKey = sellerId
    ? `sellerId: "${sellerId}"`
    : `buyerId: "${userID}"`

  const exchangeData = await exchangeLoader({
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
  // console.log({ offset })

  const orderEventNodes = orderEvents.map((event, index) => {
    return { ...event, id: `event-${index}` }
  })
  return orderEventNodes
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
