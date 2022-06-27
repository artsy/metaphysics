import { GraphQLError, GraphQLSchema, Kind, SelectionSetNode } from "graphql"
import { amountSDL, amount } from "schema/v1/fields/money"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"
import { delegateToSchema } from "@graphql-tools/delegate"
import { ArtworkVersionType } from "schema/v2/artwork_version"
import { WrapQuery } from "graphql-tools"

const orderTotals = [
  "itemsTotal",
  "sellerTotal",
  "commissionFee",
  "totalListPrice",
  "buyerTotal",
  "taxTotal",
  "shippingTotal",
  "transactionFee",
  "artsyTotal",
]
const orderTotalsSDL = orderTotals.map(amountSDL)

const lineItemTotals = ["shippingTotal", "listPrice", "commissionFee"]
const lineItemTotalsSDL = lineItemTotals.map(amountSDL)

const offerAmountFields = ["amount", "taxTotal", "shippingTotal", "buyerTotal"]
const offerAmountFieldsSDL = offerAmountFields.map(amountSDL)

const shippingQuoteFields = ["price"]
const shippingQuoteFieldsSDL = shippingQuoteFields.map(amountSDL)

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

  const paymentMethodDetailsResolver = {
    fragment: gql`
      fragment CommerceOrderPaymentMethod on CommerceOrder {
        creditCardId
        bankAccountId
        paymentMethod
      }
    `,

    resolve: async (parent, _args, context, info) => {
      const { creditCardId, bankAccountId, paymentMethod } = parent

      if (paymentMethod === "CREDIT_CARD" && Boolean(creditCardId)) {
        const creditCard = await info.mergeInfo.delegateToSchema({
          schema: localSchema,
          operation: "query",
          fieldName: "creditCard",
          args: {
            id: creditCardId,
          },
          context,
          info,
        })
        return creditCard
      } else if (
        paymentMethod === "US_BANK_ACCOUNT" &&
        Boolean(bankAccountId)
      ) {
        const bankAccount = await info.mergeInfo.delegateToSchema({
          schema: localSchema,
          operation: "query",
          fieldName: "bankAccount",
          args: {
            id: bankAccountId,
          },
          context,
          info,
        })
        return bankAccount
      } else if (paymentMethod === "WIRE_TRANSFER") {
        return { __typename: "WireTransfer", isManualPayment: true }
      } else {
        return null
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

  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`


    extend type Conversation {
      orderConnection(
        sellerId: ID
        participantType: CommerceOrderParticipantEnum
        state: CommerceOrderStateEnum
        states: [CommerceOrderStateEnum!]
        after: String
        before: String
        first: Int
        last: Int
      ): CommerceOrderConnectionWithTotalCount
    }

    extend type CommerceShippingQuote {
      ${shippingQuoteFieldsSDL.join("\n")}
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
      paymentMethodDetails: PaymentMethodUnion
      conversation: Conversation
      
      ${orderTotalsSDL.join("\n")}
    }

    extend type CommerceOfferOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty
      creditCard: CreditCard
      paymentMethodDetails: PaymentMethodUnion
      isInquiryOrder: Boolean!
      conversation: Conversation

      ${orderTotalsSDL.join("\n")}
      ${amountSDL("offerTotal")}
    }

    extend interface CommerceOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty
      creditCard: CreditCard
      paymentMethodDetails: PaymentMethodUnion
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
      # Creates an order and links the conversation to it
      createInquiryOrder(
        input: CommerceCreateInquiryOrderWithArtworkInput!
      ): CommerceCreateInquiryOrderWithArtworkPayload
      createInquiryOfferOrder(
        input: CommerceCreateInquiryOfferOrderWithArtworkInput!
      ): CommerceCreateInquiryOfferOrderWithArtworkPayload
      # Submits an OfferOrder and creates a conversation for it
      submitOfferOrderWithConversation(
        input: CommerceSubmitOrderWithOfferInput!
      ): CommerceSubmitOrderWithOfferPayload
    }
  `,

    // Resolvers for the above
    resolvers: {
      Conversation: {
        orderConnection: {
          fragment: gql`
            fragment Conversation_orderConnection on Conversation {
              internalID
            }
          `,
          resolve: (
            { internalID: conversationId },
            {
              sellerId,
              ...requestArgs
            }: {
              /* Deprecated - use sellerId */
              participantType?: any
              /* Overrides buyer_id in request */
              sellerId?: string
              first?: number
              last?: number
              after?: string
              before?: string
              state?: string
              states?: [string]
            },
            context,
            info
          ) => {
            const viewerKey = sellerId
              ? { sellerId: sellerId }
              : { buyerId: context.userID }

            const exchangeArgs = {
              ...requestArgs,
              ...viewerKey,
              impulseConversationId: conversationId,
            }

            return info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "query",
              fieldName: "commerceOrders",
              args: exchangeArgs,
              context,
              info,
            })
          },
        },
      },
      CommerceShippingQuote: {
        ...totalsResolvers("CommerceShippingQuote", shippingQuoteFields),
      },
      CommerceBuyOrder: {
        // The money helper resolvers
        ...totalsResolvers("CommerceBuyOrder", orderTotals),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
        creditCard: creditCardResolver,
        paymentMethodDetails: paymentMethodDetailsResolver,
      },
      CommerceOfferOrder: {
        ...totalsResolvers("CommerceOfferOrder", orderTotals),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
        creditCard: creditCardResolver,
        paymentMethodDetails: paymentMethodDetailsResolver,
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
        paymentMethodDetails: paymentMethodDetailsResolver,
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
        createInquiryOrder: {
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
              console.log("error", e)
              throw new GraphQLError(
                `[metaphysics @ exchange/v2/stitching] Conversation not found`
              )
            }

            const orderResult = await info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "mutation",
              fieldName: "commerceCreateInquiryOrderWithArtwork",
              args,
              context,
              info,
              transforms: [
                // add orderOrError.order.internalID to the Order selectionSet
                new WrapQuery(
                  [
                    "commerceCreateInquiryOrderWithArtwork",
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

            const { orderOrError } = orderResult

            if (orderOrError.error) {
              return orderResult
            } else if (orderOrError.order) {
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
                  "[metaphysics @ exchange/v2/stitching] Impulse: request to associate order with conversation failed"
                )
              }
            }

            return orderResult
          },
        },
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
        submitOfferOrderWithConversation: {
          resolve: async (_source, args, context, info) => {
            const { submitArtworkInquiryRequestLoader } = context

            const submitOrderWithOffer = await info.mergeInfo.delegateToSchema({
              schema: exchangeSchema,
              operation: "mutation",
              fieldName: "commerceSubmitOrderWithOffer",
              args,
              context,
              info,
              transforms: [
                // add orderOrError.order.internalID, orderOrError.order.lastOffer.note, orderOrError.order.lineItems.edges[0].node.artworkId
                // to the Order selectionSet
                new WrapQuery(
                  ["commerceSubmitOrderWithOffer", "orderOrError", "order"],
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
                      {
                        kind: Kind.FIELD,
                        name: {
                          kind: Kind.NAME,
                          value: "source",
                        },
                      },
                      {
                        kind: Kind.INLINE_FRAGMENT,
                        typeCondition: {
                          kind: Kind.NAMED_TYPE,
                          name: {
                            kind: Kind.NAME,
                            value: "CommerceOfferOrder",
                          },
                        },
                        selectionSet: {
                          kind: Kind.SELECTION_SET,
                          selections: [
                            {
                              kind: Kind.FIELD,
                              name: {
                                kind: Kind.NAME,
                                value: "myLastOffer",
                              },
                              selectionSet: {
                                kind: Kind.SELECTION_SET,
                                selections: [
                                  {
                                    kind: Kind.FIELD,
                                    name: {
                                      kind: Kind.NAME,
                                      value: "note",
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: Kind.FIELD,
                              name: {
                                kind: Kind.NAME,
                                value: "lineItems",
                              },
                              selectionSet: {
                                kind: Kind.SELECTION_SET,
                                selections: [
                                  {
                                    kind: Kind.FIELD,
                                    name: {
                                      kind: Kind.NAME,
                                      value: "edges",
                                    },
                                    selectionSet: {
                                      kind: Kind.SELECTION_SET,
                                      selections: [
                                        {
                                          kind: Kind.FIELD,
                                          name: {
                                            kind: Kind.NAME,
                                            value: "node",
                                          },
                                          selectionSet: {
                                            kind: Kind.SELECTION_SET,
                                            selections: [
                                              {
                                                kind: Kind.FIELD,
                                                name: {
                                                  kind: Kind.NAME,
                                                  value: "artworkId",
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
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

            const { orderOrError } = submitOrderWithOffer

            if (
              orderOrError.error ||
              !orderOrError.order ||
              orderOrError.order.source === "inquiry"
            ) {
              return submitOrderWithOffer
            }

            try {
              const { order } = orderOrError

              await submitArtworkInquiryRequestLoader({
                artwork: order.lineItems.edges[0].node.artworkId,
                message: order.myLastOffer.note,
                order_id: order.internalID,
              })
            } catch (e) {
              console.error(e)
              throw new GraphQLError(
                `[metaphysics @ exchange/v2/stitching] Gravity: request to create inquiry failed`
              )
            }

            return submitOrderWithOffer
          },
        },
      },
    },
  }
}
