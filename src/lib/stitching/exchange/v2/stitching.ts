import { GraphQLError, GraphQLSchema, Kind, SelectionSetNode } from "graphql"
import { amountSDL, amount } from "schema/v1/fields/money"
import gql from "lib/gql"
import {
  connectionFromArray,
  connectionFromArraySlice,
  toGlobalId,
} from "graphql-relay"
import { delegateToSchema } from "@graphql-tools/delegate"
import { ArtworkVersionType } from "schema/v2/artwork_version"
import { WrapQuery } from "graphql-tools"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { MessageConnection } from "schema/v2/me/conversation"
import { resolve } from "url"
import { MessageType } from "schema/v1/me/conversation/message"
import { access } from "fs"

const orderTotals = [
  "itemsTotal",
  "sellerTotal",
  "commissionFee",
  "totalListPrice",
  "buyerTotal",
  "taxTotal",
  "shippingTotal",
  "transactionFee",
]
const orderTotalsSDL = orderTotals.map(amountSDL)

const lineItemTotals = ["shippingTotal", "listPrice", "commissionFee"]
const lineItemTotalsSDL = lineItemTotals.map(amountSDL)

const offerAmountFields = ["amount", "taxTotal", "shippingTotal", "buyerTotal"]
const offerAmountFieldsSDL = offerAmountFields.map(amountSDL)
export const exchangeStitchingEnvironment = ({
  localSchema,
  exchangeSchema,
}: {
  localSchema: GraphQLSchema
  exchangeSchema: GraphQLSchema & { transforms: any }
}) => {
  type DetailsFactoryInput = { from: string; to: string }

  /**
   * This returns a resolver which can take an exchange OrderParty union
   * and convert it into a metaphysics `OrderParty`.
   *
   * You pass in the field to get the details from, and and the new fieldName
   */
  const partyUnionToDetailsFactory = ({ from, to }: DetailsFactoryInput) => {
    // We abuse the query alias feature to make sure that all
    // the data we need to generate the full object from
    // is included.
    //
    // It's possible that this working around a bug in how the fragment is put
    // together by graphql-tools.
    const aliasedPartyFragment = (field, alias) => {
      return gql`
      ... on CommerceOrder {
        ${alias}: ${field} {
          __typename
          ... on CommerceUser {
            __typename
            id
          }
          ... on CommercePartner {
            __typename
            id
          }
        }
      }`
    }

    return {
      // Bit of a magic in next line, when adding fragment, it seems
      // all second level fields (e.g. b in this query { a { b } }) are
      // ignored, so __typename and id couldn't be added, so the hack
      // was to alias the fragment field and that gets the current fields
      fragment: aliasedPartyFragment(from, to),
      resolve: (parent, _args, context, info) => {
        const typename = parent[to].__typename
        const id = parent[to].id

        // Make a call to the user or partner resolver on query to
        // grab our Metaphysics representations
        return (
          info.mergeInfo
            .delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: typename === "CommerceUser" ? "user" : "partner",
              args: {
                id,
              },
              context,
              info,
              transforms: exchangeSchema.transforms,
            })
            // Re-jigger the type systems back into place, as right now
            // it is considered a CommerceUser and clients will reject it.
            .then((response) => {
              response.__typename =
                typename === "CommerceUser" ? "User" : "Partner"
              return response
            })
        )
      },
    }
  }

  const buyerDetailsResolver = partyUnionToDetailsFactory({
    from: "buyer",
    to: "buyerDetails",
  })
  const sellerDetailsResolver = partyUnionToDetailsFactory({
    from: "seller",
    to: "sellerDetails",
  })
  const fromDetailsResolver = partyUnionToDetailsFactory({
    from: "from",
    to: "fromDetails",
  })

  const creditCardResolver = {
    fragment: `fragment CommerceOrderCreditCard on CommerceOrder { creditCardId }`,
    resolve: (parent, _args, context, info) => {
      const id = parent.creditCardId
      if (!id) {
        return null
      } else {
        return info.mergeInfo.delegateToSchema({
          schema: localSchema,
          operation: "query",
          fieldName: "creditCard",
          args: {
            id,
          },
          context,
          info,
          transforms: exchangeSchema.transforms,
        })
      }
    },
  }

  const inquiryOrderResolvers = {
    isInquiryOrder: {
      fragment: gql`
        fragment CommerceOrderIsInquiryOrder on CommerceOfferOrder {
          impulseConversationId
        }
      `,
      resolve: async (order) => {
        const { impulseConversationId } = order
        return Boolean(impulseConversationId)
      },
    },
    conversation: {
      fragment: gql`
        fragment CommerceOrderConversation on CommerceOfferOrder {
          impulseConversationId
        }
      `,
      resolve: async (order, _args, context, info) => {
        const { impulseConversationId } = order
        if (!impulseConversationId) return null

        return info.mergeInfo.delegateToSchema({
          schema: localSchema,
          operation: "query",
          fieldName: "_do_not_use_conversation",
          args: { id: impulseConversationId },
          context,
          info,
        })
      },
    },
  }

  // Map the totals array to a set of resolvers that call the amount function
  // the type param is only used for the fragment name
  const totalsResolvers = (type, totalSDLS) =>
    reduceToResolvers(
      totalSDLS.map((name) => ({
        [name]: {
          fragment: `fragment ${type}_${name} on ${type} { ${name}Cents currencyCode }`,
          resolve: (parent, args, _context, _info) => {
            return amount((_) => parent[name + "Cents"]).resolve(parent, args)
          },
        },
      }))
    )

  // Used to convert an array of `key: resolvers` to a single obj
  const reduceToResolvers = (arr) => arr.reduce((a, b) => ({ ...a, ...b }))
  /*

resolve events:
- get impulse message loader from context and load correct page of messages
- get all offers for conversation order(s)
- iterate over messages and insert offers by timestamp

## New type mixed in with messages

type ConversationOrderEvent implements Node {

}



*/
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`

    type ConversationEvent implements Node{
      id: ID!
      message: String
    }

    union ConversationEventKind = Message | ConversationEvent

    type ConversationEventEdge {
      cursor: String!
      node: ConversationEventKind!
    }

    type ConversationEventConnection {
      # A list of edges.
      edges: [ConversationEventEdge]

      # Information to aid in pagination.
      pageInfo: PageInfo!
      totalCount: Int
    }

    extend type Conversation {
      orderConnection(
        participantType: CommerceOrderParticipantEnum!
        after: String
        before: String
        first: Int
        last: Int
      ): CommerceOrderConnectionWithTotalCount

      eventConnection(
        participantType: CommerceOrderParticipantEnum!
        after: String
        before: String
        first: Int
        last: Int
      ): ConversationEventConnection!

    }

    extend type CommerceLineItem {
      artwork: Artwork
      artworkVersion: ArtworkVersion
      artworkOrEditionSet: ArtworkOrEditionSetType
      ${lineItemTotalsSDL.join("\n")}
    }

    extend type CommerceBuyOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty
      creditCard: CreditCard
      
      ${orderTotalsSDL.join("\n")}
    }

    extend type CommerceOfferOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty
      creditCard: CreditCard
      isInquiryOrder: Boolean!
      conversation: Conversation

      ${orderTotalsSDL.join("\n")}
      ${amountSDL("offerTotal")}
    }

    extend interface CommerceOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty
      creditCard: CreditCard

      ${orderTotalsSDL.join("\n")}
    }

    extend type CommerceOffer {
      fromDetails: OrderParty
      ${offerAmountFieldsSDL.join("\n")}
    }

    extend type Me {
      orders(first: Int, last: Int, after: String, before: String, mode: CommerceOrderModeEnum, sellerId: String, sort: CommerceOrderConnectionSortEnum, states: [CommerceOrderStateEnum!]): CommerceOrderConnectionWithTotalCount
    }

    extend type Mutation {
      createInquiryOfferOrder(
        input: CommerceCreateInquiryOfferOrderWithArtworkInput!
      ): CommerceCreateInquiryOfferOrderWithArtworkPayload
    }
  `,
    /*

conversation(id: sdaf) {

  eventConnection() { edges { node {
    # message: Message
    message {
      id
      internalID
      isFromUser
      isFirstMessage
      body
      createdAt
      ...
    }
    # commerceEvent: CommerceEvent
    commerceEvent {
      kind 
      message
    }
  }}}
}

*/
    // Resolvers for the above
    resolvers: {
      Conversation: {
        eventConnection: {
          fragment: gql`
            fragment Conversation_eventConnection on Conversation {
              internalID
              from {
                email
                name
              }
              initialMessage: messagesConnection(first: 1) {
                edges {
                  node {
                    body
                    internalID
                  }
                }
              }
              lastMessage: messagesConnection(last: 1) {
                edges {
                  node {
                    body
                    internalID
                  }
                }
              }
              messagesConnection {
                edges
              }
            }
          `,
          resolve: async (root, args, context, info) => {
            const { internalID, from, initialMessage, lastMessage } = root
            const { conversationMessagesLoader } = context
            const lastMessageId = lastMessage?.edges?.node?.internalID
            const initialMessageBody = initialMessage?.edges?.node?.body

            if (!conversationMessagesLoader) return null
            const argKeys = Object.keys(args)
            if (argKeys.includes("last") && !argKeys.includes("before")) {
              args.before = lastMessageId
            }
            const { page, size, offset } = convertConnectionArgsToGravityArgs(
              args
            )
            const {
              total_count,
              message_details,
            } = await conversationMessagesLoader({
              page,
              size,
              conversation_id: internalID,
              "expand[]": "deliveries",
              sort: args.sort || "asc",
            })
            // Inject the convesation initiator's email into each message payload
            // so we can tell if the user sent a particular message.
            // Also inject the conversation id, since we need it in some message
            // resolvers (invoices).
            /* eslint-disable no-param-reassign */
            const messageResult = message_details.map((message) => {
              console.log(message)
              const messageFields = MessageType.getFields()
              return Object.entries(messageFields).reduce(
                (acc, [key, field]) => {
                  return {
                    ...acc,
                    [key]: field.resolve!(
                      message,
                      {
                        /* how to get args? */
                      },
                      context,
                      info
                    ),
                  }
                },
                { __typename: "Message" } as any
              )
              // return {
              //   ...message,
              //   __typename: "Message",
              //   conversation_initial_message: initialMessageBody,
              //   conversation_from_name: from.name,
              //   conversation_from_address: from?.email,
              //   conversation_id: internalID,
              // }
            })
            const fullResult = [...messageResult]
            console.log({ total_count, fullResult })
            /*
            context.conversationLoader
            const messageResult = info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "messageConnection",
              args: {},
              context,
              info,
            })
            // alternativeley message loader
            const messageResult = messageLoader()
            const eventResults = info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "query",
              fieldName: "commerceOffers",
              args: {},
              context,
              info,
            })
            // alternatively fetch from exchange
            return connectionFromArray(messageResult + eventResults, args)
      */
            return connectionFromArraySlice(fullResult, args, {
              arrayLength: total_count,
              sliceStart: offset,
            })
          },
        },
        orderConnection: {
          fragment: gql`
            fragment Conversation_orderConnection on Conversation {
              internalID
            }
          `,
          resolve: async (
            { internalID: conversationId },
            { participantType, ...requestArgs },
            context,
            info
          ) => {
            const viewerKey =
              participantType === "BUYER" ? "buyerId" : "sellerId"
            const { userID } = context

            const exchangeArgs = {
              ...requestArgs,
              impulseConversationId: conversationId,
              [viewerKey]: userID,
            }

            const os = await info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "query",
              fieldName: "commerceOrders",
              args: exchangeArgs,
              context,
              info,
            })
            console.warn(os)
            return os
          },
        },
      },
      CommerceBuyOrder: {
        // The money helper resolvers
        ...totalsResolvers("CommerceBuyOrder", orderTotals),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
        creditCard: creditCardResolver,
      },
      CommerceOfferOrder: {
        ...totalsResolvers("CommerceOfferOrder", orderTotals),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
        creditCard: creditCardResolver,
        ...inquiryOrderResolvers,
      },
      CommerceLineItem: {
        artwork: {
          fragment: `fragment CommerceLineItemArtwork on CommerceLineItem { artworkId }`,
          resolve: (parent, _args, context, info) => {
            const id = parent.artworkId
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artwork",
              args: {
                id,
              },
              context,
              info,
            })
          },
        },
        artworkVersion: {
          fragment: `fragment CommerceLineItemArtwork on CommerceLineItem { artworkVersionId }`,
          resolve: (parent, _args, context, info) => {
            const id = parent.artworkVersionId
            const globalID = toGlobalId("ArtworkVersion", id)
            return delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "node",
              args: {
                id: globalID,
              },
              context,
              info,
              transforms: exchangeSchema.transforms,
              returnType: ArtworkVersionType,
            })
          },
        },

        artworkOrEditionSet: {
          fragment: gql`
            ... on CommerceLineItem {
              artworkId
              editionSetId
            }
          `,
          resolve: async (parent, _args, context, info) => {
            const artworkId = parent.artworkId
            const editionSetId = parent.editionSetId

            if (editionSetId) {
              return info.mergeInfo.delegateToSchema({
                schema: localSchema,
                operation: "query",
                fieldName: "artwork",
                args: {
                  id: artworkId,
                },
                context,
                info,
                transforms: [
                  // Wrap document takes a subtree as an AST node
                  new WrapQuery(
                    // path at which to apply wrapping and extracting
                    ["artwork"],
                    (subtree: SelectionSetNode) => ({
                      // we create a wrapping AST Field
                      kind: Kind.FIELD,
                      name: {
                        kind: Kind.NAME,
                        value: "editionSet",
                      },
                      arguments: [
                        {
                          kind: Kind.ARGUMENT,
                          name: {
                            kind: Kind.NAME,
                            value: "id",
                          },
                          value: {
                            kind: Kind.STRING,
                            value: editionSetId,
                          },
                        },
                      ],
                      // Inside the field selection
                      selectionSet: subtree,
                    }),
                    // how to process the data result at path
                    (result) => {
                      return result.editionSet
                    }
                  ),
                ],
              })
            }

            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artwork",
              args: {
                id: artworkId,
              },
              context,
              info,
            })
          },
        },

        ...totalsResolvers("CommerceLineItem", lineItemTotals),
      },
      CommerceOrder: {
        // The money helper resolvers
        ...totalsResolvers("CommerceOrder", orderTotals),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
        creditCard: creditCardResolver,
      },
      CommerceOffer: {
        ...totalsResolvers("CommerceOffer", offerAmountFields),
        fromDetails: fromDetailsResolver,
      },
      Me: {
        orders: {
          fragment: gql`... on Me {
            __typename
          }`,
          resolve: async (_source, args, context, info) => {
            return await info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "query",
              fieldName: "commerceMyOrders",
              args,
              context,
              info,
            })
          },
        },
      },
      Mutation: {
        createInquiryOfferOrder: {
          resolve: async (_source, args, context, info) => {
            const {
              conversationLoader,
              conversationCreateConversationOrderLoader,
            } = context
            const {
              input: { impulseConversationId },
            } = args

            try {
              await conversationLoader(impulseConversationId)
            } catch (e) {
              throw new GraphQLError(
                `[metaphysics @ exchange/v2/stitching] Conversation not found`
              )
            }

            const offerResult = await info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "mutation",
              fieldName: "commerceCreateInquiryOfferOrderWithArtwork",
              args,
              context,
              info,
              transforms: [
                // add orderOrError.order.internalID to the Order selectionSet
                new WrapQuery(
                  [
                    "commerceCreateInquiryOfferOrderWithArtwork",
                    "orderOrError",
                    "order",
                  ],
                  (selectionSet: SelectionSetNode) => {
                    const newSelections = [
                      ...selectionSet.selections,
                      {
                        kind: Kind.FIELD,
                        name: {
                          kind: Kind.NAME,
                          value: "internalID",
                        },
                      },
                    ]
                    return { ...selectionSet, selections: newSelections }
                  },
                  (result) => {
                    return result
                  }
                ),
              ],
            })

            const { orderOrError } = offerResult

            if (orderOrError.error) {
              // if we got an error from exchange, return it immediately
              return offerResult
            } else if (orderOrError.order) {
              // attempt to associate the order with the conversation
              const {
                order: { internalID: orderId },
              } = orderOrError

              try {
                await conversationCreateConversationOrderLoader({
                  conversation_id: impulseConversationId,
                  exchange_order_id: orderId,
                })
              } catch (e) {
                throw new GraphQLError(
                  "[metaphysics @ exchange/v2/stitching] Impulse: request to associate offer with conversation failed"
                )
              }
            }

            return offerResult
          },
        },
      },
    },
  }
}
