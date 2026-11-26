import { graphql, OperationTypeNode } from "graphql"
import config from "config"
import gql from "lib/gql"
import {
  getExchangeMergedSchema,
  getExchangeStitchedSchema,
} from "./testingUtils"

// Lets a test see when `orderConnection` falls back to Exchange GraphQL,
// without sending the delegated query anywhere.
const mockDelegateToExchange = jest.fn()
jest.mock("lib/stitching/lib/delegateToSchema", () => {
  const actual = jest.requireActual("lib/stitching/lib/delegateToSchema")
  return {
    delegateToSchema: (options) =>
      options.fieldName === "commerceOrders" && !options.info?.mergeInfo
        ? mockDelegateToExchange(options)
        : actual.delegateToSchema(options),
  }
})

const buyOrder = {
  id: "buy-order-id",
  code: "B123",
  mode: "buy",
  created_at: "2026-11-01T10:00:00Z",
  currency_code: "USD",
  impulse_conversation_id: "conversation-id",
  source: "inquiry",
  payment_method: "credit card",
  state: "submitted",
  state_reason: null,
  state_updated_at: "2026-11-02T10:00:00Z",
  updated_at: "2026-11-03T10:00:00Z",
  display_state: "payment_failed",
  buyer_id: "user-id",
  buyer_type: "user",
  seller_id: "partner-id",
  seller_type: "gallery",
  shipping_name: "Dr Collector",
  shipping_address_line1: "401 Broadway",
  shipping_address_line2: "Floor 25",
  shipping_city: "New York",
  shipping_region: "NY",
  shipping_postal_code: "10013",
  shipping_country: "US",
  buyer_phone_number: "555-555-5555",
  fulfillment_type: "ship",
  items_total_cents: 100000,
  shipping_total_cents: 2500,
  tax_total_cents: 1234,
  total_list_price_cents: 100000,
  buyer_total_cents: 103734,
  credit_card_id: "credit-card-id",
  buyer_state: "payment_failed",
  buyer_state_expires_at: "2026-11-05T15:30:00Z",
  line_items: [
    {
      id: "line-item-id",
      artwork_id: "artwork-id",
      artwork_version_id: "artwork-version-id",
      list_price_cents: 100000,
      quantity: 1,
      shipping_total_cents: 2500,
      currency_code: "USD",
      selected_shipping_quote: { display_name: "Standard" },
    },
  ],
  submitted_offers: [],
  last_submitted_offer: null,
}

const buyerOffer = {
  id: "offer-1",
  amount_cents: 80000,
  creator_id: "creator-id",
  currency_code: "USD",
  created_at: "2026-11-01T10:00:00Z",
  defines_total: false,
  has_definite_total: false,
  from_id: "user-id",
  from_participant: "buyer",
  from_type: "user",
  offer_amount_changed: true,
  responds_to_id: null,
  submitted_at: "2026-11-01T10:00:00Z",
}

const sellerCounter = {
  id: "offer-2",
  amount_cents: 90000,
  creator_id: "creator-id",
  currency_code: "USD",
  created_at: "2026-11-02T10:00:00Z",
  defines_total: true,
  has_definite_total: true,
  from_id: "partner-id",
  from_participant: "seller",
  from_type: "gallery",
  offer_amount_changed: true,
  responds_to_id: "offer-1",
  submitted_at: "2026-11-02T10:00:00Z",
}

const offerOrder = {
  ...buyOrder,
  id: "offer-order-id",
  code: "O456",
  mode: "offer",
  display_state: "submitted",
  state: "in_review",
  buyer_state: "offer_received",
  buyer_action: "OFFER_RECEIVED",
  updated_at: "2026-11-04T10:00:00Z",
  fulfillment_type: "pickup",
  credit_card_id: null,
  line_items: [{ ...buyOrder.line_items[0], selected_shipping_quote: null }],
  submitted_offers: [sellerCounter, buyerOffer],
  last_submitted_offer: sellerCounter,
}

const history = [
  {
    type: "offer_submitted",
    created_at: "2026-11-01T10:00:00Z",
    offer: buyerOffer,
  },
  {
    type: "order_state_changed",
    created_at: "2026-11-01T10:00:01Z",
    state: "submitted",
    state_reason: null,
    order_update_state: "offer_submitted",
  },
  {
    type: "offer_submitted",
    created_at: "2026-11-02T10:00:00Z",
    // Not among the order's submitted offers, so `respondsTo` falls back
    offer: { ...sellerCounter, id: "offer-3", responds_to_id: "unknown" },
  },
]

const orderConnectionQuery = gql`
  {
    _do_not_use_conversation(id: "conversation-id") {
      orderConnection(first: 10, states: [SUBMITTED, APPROVED]) {
        totalCount
        pageInfo {
          hasNextPage
        }
        edges {
          node {
            __typename
            id
            internalID
            code
            mode
            state
            stateReason
            stateUpdatedAt
            stateExpiresAt
            formattedExpiry: stateExpiresAt(format: "MMM D, h:mm A zz")
            shortExpiry: stateExpiresAt(format: "MMM D")
            updatedAt
            displayState
            buyerTotal(precision: 2)
            shippingTotal(precision: 2)
            taxTotal(precision: 2)
            creditCard {
              lastDigits
            }
            lineItems {
              edges {
                node {
                  artwork {
                    internalID
                  }
                  selectedShippingQuote {
                    displayName
                  }
                }
              }
            }
            requestedFulfillment {
              __typename
              ... on CommerceShip {
                name
                addressLine1
                city
                postalCode
                country
              }
            }
            ... on CommerceOfferOrder {
              buyerAction
              lastOffer {
                amount(precision: 2)
                creatorId
                hasDefiniteTotal
                fromParticipant
                offerAmountChanged
                from {
                  __typename
                }
                respondsTo {
                  fromParticipant
                }
              }
            }
          }
        }
      }
    }
  }
`

const historyQuery = gql`
  {
    _do_not_use_conversation(id: "conversation-id") {
      orderConnection(first: 10) {
        edges {
          node {
            internalID
            orderHistory {
              __typename
              ... on CommerceOrderStateChangedEvent {
                createdAt
                state
                stateReason
                orderUpdateState
              }
              ... on CommerceOfferSubmittedEvent {
                createdAt(format: "MMM D")
                offer {
                  amount(precision: 2)
                  definesTotal
                  fromParticipant
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
    }
  }
`

describe("Exchange REST reads", () => {
  const originalFlag = config.EXCHANGE_REST_READS

  beforeEach(() => {
    config.EXCHANGE_REST_READS = true
  })

  afterEach(() => {
    config.EXCHANGE_REST_READS = originalFlag
  })

  const expectRestCall = (context, overrides = {}) =>
    expect(context.meOrdersLoader).toHaveBeenCalledWith({
      details: true,
      impulse_conversation_id: "conversation-id",
      page: 1,
      size: 10,
      sort: "STATE_UPDATED_AT_DESC",
      ...overrides,
    })

  const buildContext = (overrides = {}) => ({
    defaultTimezone: "America/New_York",
    userID: "user-id",
    conversationLoader: jest.fn().mockResolvedValue({ id: "conversation-id" }),
    creditCardLoader: jest
      .fn()
      .mockResolvedValue({ id: "credit-card-id", last_digits: "4242" }),
    artworkLoader: jest
      .fn()
      .mockResolvedValue({ _id: "artwork-id", id: "artwork-slug" }),
    meOrdersLoader: jest.fn().mockResolvedValue({
      body: [buyOrder, offerOrder],
      headers: { "x-total-count": "3" },
    }),
    ...overrides,
  })

  const runQuery = async (source: string, context) => {
    const schema = await getExchangeMergedSchema()
    return graphql({ schema, source, contextValue: context })
  }

  describe("Conversation.orderConnection", () => {
    it("delegates to Exchange GraphQL when the flag is off", async () => {
      config.EXCHANGE_REST_READS = false
      const { resolvers } = await getExchangeStitchedSchema()
      const mergeInfo = { delegateToSchema: jest.fn() }
      const context = buildContext()

      await resolvers.Conversation.orderConnection.resolve(
        { internalID: "conversation-id" },
        { first: 10 },
        context,
        { mergeInfo }
      )

      expect(context.meOrdersLoader).not.toHaveBeenCalled()
      expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          args: {
            buyerId: "user-id",
            first: 10,
            impulseConversationId: "conversation-id",
          },
          fieldName: "commerceOrders",
          operation: OperationTypeNode.QUERY,
        })
      )
    })

    it("delegates seller requests to Exchange GraphQL when the flag is on", async () => {
      const { resolvers } = await getExchangeStitchedSchema()
      const context = buildContext()

      for (const args of [
        { sellerId: "partner-id" },
        { participantType: "SELLER" },
        { after: "MQ" },
      ]) {
        const mergeInfo = { delegateToSchema: jest.fn() }
        await resolvers.Conversation.orderConnection.resolve(
          { internalID: "conversation-id" },
          args,
          context,
          { mergeInfo }
        )
        expect(mergeInfo.delegateToSchema).toHaveBeenCalled()
      }

      expect(context.meOrdersLoader).not.toHaveBeenCalled()
    })

    it("maps buy and offer orders from Exchange REST", async () => {
      const context = buildContext()

      const result = await runQuery(orderConnectionQuery, context)

      expect(result.errors).toBeUndefined()
      expectRestCall(context, { state: "SUBMITTED,APPROVED" })
      expect(context.creditCardLoader).toHaveBeenCalledTimes(1)

      const connection = (result.data as any)._do_not_use_conversation
        .orderConnection

      expect(connection.totalCount).toEqual(3)
      expect(connection.pageInfo).toEqual({ hasNextPage: true })
      expect(connection.edges.map(({ node }) => node)).toEqual([
        {
          __typename: "CommerceBuyOrder",
          id: "buy-order-id",
          internalID: "buy-order-id",
          code: "B123",
          mode: "BUY",
          state: "SUBMITTED",
          stateReason: null,
          stateUpdatedAt: "2026-11-02T05:00:00-05:00",
          stateExpiresAt: "2026-11-05T10:30:00-05:00",
          formattedExpiry: "Nov 5, 10:30 AM EST",
          shortExpiry: "Nov 5",
          updatedAt: "2026-11-03T05:00:00-05:00",
          displayState: "PAYMENT_FAILED",
          buyerTotal: "$1,037.34",
          shippingTotal: "$25.00",
          taxTotal: "$12.34",
          creditCard: { lastDigits: "4242" },
          lineItems: {
            edges: [
              {
                node: {
                  artwork: { internalID: "artwork-id" },
                  selectedShippingQuote: { displayName: "Standard" },
                },
              },
            ],
          },
          requestedFulfillment: {
            __typename: "CommerceShip",
            name: "Dr Collector",
            addressLine1: "401 Broadway",
            city: "New York",
            postalCode: "10013",
            country: "US",
          },
        },
        {
          __typename: "CommerceOfferOrder",
          id: "offer-order-id",
          internalID: "offer-order-id",
          code: "O456",
          mode: "OFFER",
          state: "IN_REVIEW",
          stateReason: null,
          stateUpdatedAt: "2026-11-02T05:00:00-05:00",
          stateExpiresAt: "2026-11-05T10:30:00-05:00",
          formattedExpiry: "Nov 5, 10:30 AM EST",
          shortExpiry: "Nov 5",
          updatedAt: "2026-11-04T05:00:00-05:00",
          displayState: "SUBMITTED",
          buyerTotal: "$1,037.34",
          shippingTotal: "$25.00",
          taxTotal: "$12.34",
          creditCard: null,
          lineItems: {
            edges: [
              {
                node: {
                  artwork: { internalID: "artwork-id" },
                  selectedShippingQuote: null,
                },
              },
            ],
          },
          requestedFulfillment: { __typename: "CommercePickup" },
          buyerAction: "OFFER_RECEIVED",
          lastOffer: {
            amount: "$900.00",
            creatorId: "creator-id",
            hasDefiniteTotal: true,
            fromParticipant: "SELLER",
            offerAmountChanged: true,
            from: { __typename: "CommercePartner" },
            respondsTo: { fromParticipant: "BUYER" },
          },
        },
      ])
    })

    it("emulates `last` with the reverse sort", async () => {
      const context = buildContext({
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [buyOrder],
          headers: { "x-total-count": "2" },
        }),
      })

      const result = await runQuery(
        gql`
          {
            _do_not_use_conversation(id: "conversation-id") {
              orderConnection(last: 1, state: APPROVED) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
                edges {
                  node {
                    internalID
                  }
                }
              }
            }
          }
        `,
        context
      )

      expect(result.errors).toBeUndefined()
      expectRestCall(context, {
        size: 1,
        sort: "STATE_UPDATED_AT_ASC",
        state: "APPROVED",
      })
      expect(
        (result.data as any)._do_not_use_conversation.orderConnection
      ).toEqual({
        pageInfo: { hasNextPage: false, hasPreviousPage: true },
        edges: [{ node: { internalID: "buy-order-id" } }],
      })
    })

    it("caps the page size like Exchange GraphQL", async () => {
      const context = buildContext()

      const result = await runQuery(
        gql`
          {
            _do_not_use_conversation(id: "conversation-id") {
              orderConnection(first: 30) {
                totalPages
              }
            }
          }
        `,
        context
      )

      expectRestCall(context, { size: 20 })
      expect(
        (result.data as any)._do_not_use_conversation.orderConnection
      ).toEqual({ totalPages: 1 })
    })

    it("embeds order history in the list call when selected", async () => {
      const context = buildContext({
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [{ ...offerOrder, history }],
          headers: { "x-total-count": "1" },
        }),
      })

      const result = await runQuery(historyQuery, context)

      expect(result.errors).toBeUndefined()
      expectRestCall(context, { history: true })
      expect(
        (result.data as any)._do_not_use_conversation.orderConnection.edges[0]
          .node.orderHistory
      ).toEqual([
        {
          __typename: "CommerceOfferSubmittedEvent",
          createdAt: "Nov 1",
          offer: {
            amount: "$800.00",
            definesTotal: false,
            fromParticipant: "BUYER",
            offerAmountChanged: true,
            respondsTo: null,
          },
        },
        {
          __typename: "CommerceOrderStateChangedEvent",
          createdAt: "2026-11-01T05:00:01-05:00",
          state: "SUBMITTED",
          stateReason: null,
          orderUpdateState: "offer_submitted",
        },
        {
          __typename: "CommerceOfferSubmittedEvent",
          createdAt: "Nov 2",
          offer: {
            amount: "$900.00",
            definesTotal: true,
            fromParticipant: "SELLER",
            offerAmountChanged: true,
            respondsTo: { fromParticipant: "BUYER" },
          },
        },
      ])
    })

    it("returns an empty history when the order has none", async () => {
      const context = buildContext()

      const result = await runQuery(historyQuery, context)

      expect(result.errors).toBeUndefined()
      const nodes = (result.data as any)._do_not_use_conversation.orderConnection.edges.map(
        ({ node }) => node
      )
      expect(nodes).toEqual([
        { internalID: "buy-order-id", orderHistory: [] },
        { internalID: "offer-order-id", orderHistory: [] },
      ])
    })

    it("only requests history when it is selected", async () => {
      const context = buildContext()

      await runQuery(orderConnectionQuery, context)

      expect(context.meOrdersLoader.mock.calls[0][0]).not.toHaveProperty(
        "history"
      )
    })

    describe("with fields REST doesn't map", () => {
      beforeEach(() => {
        mockDelegateToExchange.mockReset().mockResolvedValue(null)
      })

      // True when the query went to Exchange GraphQL and not to REST
      const isDelegated = async (source: string) => {
        const context = buildContext()
        const result = await runQuery(source, context)

        return (
          !result.errors &&
          context.meOrdersLoader.mock.calls.length === 0 &&
          mockDelegateToExchange.mock.calls.some(
            ([options]) => options.fieldName === "commerceOrders"
          )
        )
      }

      it("delegates when an unmapped order field is selected", async () => {
        expect(
          await isDelegated(gql`
            {
              _do_not_use_conversation(id: "conversation-id") {
                orderConnection(first: 10) {
                  edges {
                    node {
                      internalID
                      paymentSet
                    }
                  }
                }
              }
            }
          `)
        ).toBe(true)
      })

      it("delegates when an unmapped offer field is selected in an inline fragment", async () => {
        expect(
          await isDelegated(gql`
            {
              _do_not_use_conversation(id: "conversation-id") {
                orderConnection(first: 10) {
                  edges {
                    node {
                      ... on CommerceOfferOrder {
                        lastOffer {
                          order {
                            internalID
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `)
        ).toBe(true)
      })

      it("delegates when an unmapped field is selected in a fragment spread", async () => {
        expect(
          await isDelegated(gql`
            {
              _do_not_use_conversation(id: "conversation-id") {
                orderConnection(first: 10) {
                  edges {
                    node {
                      ...OrderFields
                    }
                  }
                }
              }
            }

            fragment OrderFields on CommerceOrder {
              internalID
              requireIdentityVerification
            }
          `)
        ).toBe(true)
      })

      it("stays on REST for mapped fields in fragments", async () => {
        const context = buildContext()

        const result = await runQuery(
          gql`
            {
              _do_not_use_conversation(id: "conversation-id") {
                orderConnection(first: 10) {
                  edges {
                    node {
                      ...OrderFields
                    }
                  }
                }
              }
            }

            fragment OrderFields on CommerceOrder {
              internalID
              ... on CommerceOfferOrder {
                lastOffer {
                  ...OfferFields
                }
              }
            }

            fragment OfferFields on CommerceOffer {
              fromParticipant
            }
          `,
          context
        )

        expect(result.errors).toBeUndefined()
        expect(context.meOrdersLoader).toHaveBeenCalled()
        expect(mockDelegateToExchange).not.toHaveBeenCalled()
      })
    })
  })

  it("returns a null buyerProfile when the order has no buyer", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const delegateToSchema = jest.fn()

    const result = await resolvers.CommerceBuyOrder.buyerProfile.resolve(
      { buyer: null },
      {},
      {},
      { mergeInfo: { delegateToSchema } }
    )

    expect(result).toBeNull()
    expect(delegateToSchema).not.toHaveBeenCalled()
  })

  describe("CollectorResume.buyerActivity", () => {
    const parent = {
      partnerId: "partner-id",
      userId: "user-id",
      purchases: { totalAuctionCount: 2, totalPrivateSaleCount: 1 },
    }

    const resolveBuyerActivity = async (
      partnerBuyerActivityLoader: jest.Mock,
      delegateToSchema = jest.fn()
    ) => {
      const { resolvers } = await getExchangeStitchedSchema()
      return resolvers.CollectorResume.buyerActivity.resolve(
        parent,
        {},
        { partnerBuyerActivityLoader },
        { mergeInfo: { delegateToSchema } }
      )
    }

    it("delegates to Exchange GraphQL when the flag is off", async () => {
      config.EXCHANGE_REST_READS = false
      const delegateToSchema = jest
        .fn()
        .mockResolvedValue({ totalPurchases: 4 })
      const partnerBuyerActivityLoader = jest.fn()

      const result = await resolveBuyerActivity(
        partnerBuyerActivityLoader,
        delegateToSchema
      )

      expect(result).toEqual({ totalPurchases: 7 })
      expect(partnerBuyerActivityLoader).not.toHaveBeenCalled()
      expect(delegateToSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          args: { buyerId: "user-id" },
          fieldName: "commerceBuyerActivity",
        })
      )
    })

    it("uses Exchange REST when the flag is on", async () => {
      const delegateToSchema = jest.fn()
      const partnerBuyerActivityLoader = jest
        .fn()
        .mockResolvedValue({ total_purchases: 4 })

      const result = await resolveBuyerActivity(
        partnerBuyerActivityLoader,
        delegateToSchema
      )

      expect(result).toEqual({ totalPurchases: 7 })
      expect(partnerBuyerActivityLoader).toHaveBeenCalledWith({
        partnerId: "partner-id",
        buyerId: "user-id",
      })
      expect(delegateToSchema).not.toHaveBeenCalled()
    })

    it("returns 0 when the REST call fails, like the GraphQL path", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation()

      const result = await resolveBuyerActivity(
        jest.fn().mockRejectedValue({ statusCode: 403 })
      )

      expect(result).toEqual({ totalPurchases: 0 })
      consoleError.mockRestore()
    })
  })
})
