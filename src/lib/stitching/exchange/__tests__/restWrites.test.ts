import { graphql } from "graphql"
import config from "config"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { getExchangeMergedSchema } from "./testingUtils"

// Lets a test see when a mutation goes to Exchange GraphQL, without sending
// the delegated mutation anywhere.
const mockDelegateToExchange = jest.fn()
jest.mock("lib/stitching/lib/delegateToSchema", () => {
  const actual = jest.requireActual("lib/stitching/lib/delegateToSchema")
  return {
    delegateToSchema: (options) =>
      options.fieldName.startsWith("commerce") && !options.info?.mergeInfo
        ? mockDelegateToExchange(options)
        : actual.delegateToSchema(options),
  }
})

const buyerOffer = {
  id: "offer-1",
  amount_cents: 80000,
  buyer_total_cents: 82500,
  created_at: "2026-11-01T10:00:00Z",
  creator_id: "user-id",
  currency_code: "USD",
  defines_total: false,
  from_id: "user-id",
  from_participant: "buyer",
  from_type: "user",
  has_definite_total: false,
  note: "Would you take less?",
  offer_amount_changed: false,
  responds_to_id: null,
  shipping_total_cents: 2500,
  submitted_at: "2026-11-01T10:00:00Z",
  tax_total_cents: 0,
}

const sellerCounter = {
  ...buyerOffer,
  id: "offer-2",
  amount_cents: 90000,
  created_at: "2026-11-02T10:00:00Z",
  creator_id: "partner-user-id",
  defines_total: true,
  from_id: "partner-id",
  from_participant: "seller",
  from_type: "gallery",
  has_definite_total: true,
  note: null,
  offer_amount_changed: true,
  responds_to_id: "offer-1",
  submitted_at: "2026-11-02T10:00:00Z",
}

// `OrderPresenter` JSON for the seller, with details
const sellerOrder = {
  id: "order-id",
  code: "O123",
  mode: "offer",
  created_at: "2026-11-01T09:00:00Z",
  updated_at: "2026-11-02T10:00:00Z",
  currency_code: "USD",
  impulse_conversation_id: "conversation-id",
  source: "inquiry",
  payment_method: "credit card",
  state: "approved",
  state_reason: null,
  state_updated_at: "2026-11-02T10:00:00Z",
  payment_set: true,
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
  fulfillment_type: "ship_arta",
  shipping_radius: null,
  items_total_cents: 90000,
  shipping_total_cents: 2500,
  tax_total_cents: 0,
  total_list_price_cents: 100000,
  buyer_total_cents: 92500,
  line_items: [
    {
      id: "line-item-id",
      artwork_id: "artwork-id",
      artwork_version_id: "artwork-version-id",
      list_price_cents: 100000,
      quantity: 1,
      shipping_total_cents: 2500,
      currency_code: "USD",
      fulfillments: [
        {
          id: "fulfillment-id",
          courier: "UPS",
          estimated_delivery: "2026-11-30",
          tracking_id: "1Z999",
        },
      ],
      selected_shipping_quote: {
        id: "quote-id",
        display_name: "Standard",
        price_cents: 2500,
        tier: "standard",
        type_name: "ground",
      },
      shipment: {
        id: "shipment-id",
        carrier_name: "ARTA",
        contact_email: "gallery@example.com",
        contact_name: "Gallery",
        contact_phone: "555-000-0000",
        delivery_end: "2026-12-05T17:00:00Z",
        delivery_start: "2026-12-04T09:00:00Z",
        label_url: "https://example.com/label.pdf",
        status: "confirmed",
        tracking_number: "ARTA1",
        tracking_url: "https://example.com/track",
      },
      shipping_quote_options: [],
    },
  ],
  submitted_offers: [sellerCounter, buyerOffer],
  last_submitted_offer: sellerCounter,
  display_state: "processing",
  last_approved_at: "2026-11-03T10:00:00Z",
  last_submitted_at: "2026-11-01T10:00:00Z",
  last_transaction_failed: false,
  last_transaction_failure_code: null,
  artsy_collects_taxes: true,
  artsy_remits_taxes: false,
  tax_types: ["sales_tax"],
  awaiting_response_from: null,
  seller_state_expires_at: "2026-11-05T15:30:00Z",
  seller_total_cents: 75000,
  artsy_total_cents: 15000,
  display_commission_rate: "15%",
  commission_fee_cents: 13500,
  transaction_fee_cents: 1500,
}

// `OrderPresenter` JSON for the buyer, without details
const createdOrder = {
  id: "new-order-id",
  code: "B456",
  mode: "buy",
  currency_code: "USD",
  state: "pending",
  buyer_id: "user-id",
  buyer_type: "user",
  seller_id: "partner-id",
  seller_type: "gallery",
  line_items: [],
  submitted_offers: [],
  last_submitted_offer: null,
}

// `OrderPresenter` JSON for the buyer, with details, after the buyer accepted
// the seller's counteroffer
const buyerOrder = {
  ...createdOrder,
  id: "order-id",
  code: "O123",
  mode: "offer",
  state: "approved",
  submitted_offers: [sellerCounter, buyerOffer],
  last_submitted_offer: sellerCounter,
  awaiting_response_from: null,
  display_state: "processing",
  last_transaction_failed: false,
  pending_offer: null,
}

// Force's buyer offer mutations (src/Apps/Order/Routes), as compiled by Relay
const FORCE_BUYER_ACCEPT_OFFER = gql`
  mutation AcceptOfferMutation($input: CommerceBuyerAcceptOfferInput!) {
    commerceBuyerAcceptOffer(input: $input) {
      orderOrError {
        __typename
        ... on CommerceOrderWithMutationSuccess {
          __typename
          order {
            __typename
            internalID
            ... on CommerceOfferOrder {
              awaitingResponseFrom
            }
            id
          }
        }
        ... on CommerceOrderWithMutationFailure {
          error {
            type
            code
            data
          }
        }
        ... on CommerceOrderRequiresAction {
          actionData {
            clientSecret
          }
        }
      }
    }
  }
`

const FORCE_BUYER_REJECT_OFFER = gql`
  mutation RejectOfferMutation($input: CommerceBuyerRejectOfferInput!) {
    commerceBuyerRejectOffer(input: $input) {
      orderOrError {
        __typename
        ... on CommerceOrderWithMutationSuccess {
          __typename
          order {
            __typename
            internalID
            ... on CommerceOfferOrder {
              awaitingResponseFrom
            }
            id
          }
        }
        ... on CommerceOrderWithMutationFailure {
          error {
            type
            code
            data
          }
        }
      }
    }
  }
`

const FORCE_SUBMIT_PENDING_OFFER = gql`
  mutation CounterSubmitMutation($input: CommerceSubmitPendingOfferInput!) {
    commerceSubmitPendingOffer(input: $input) {
      orderOrError {
        __typename
        ... on CommerceOrderWithMutationSuccess {
          order {
            __typename
            state
            ... on CommerceOfferOrder {
              awaitingResponseFrom
            }
            id
          }
        }
        ... on CommerceOrderWithMutationFailure {
          error {
            type
            code
            data
          }
        }
      }
    }
  }
`

const ORDER_OR_ERROR = `
  orderOrError {
    __typename
    ... on CommerceOrderWithMutationSuccess {
      order {
        internalID
        mode
      }
    }
    ... on CommerceOrderWithMutationFailure {
      error {
        type
        code
        data
      }
    }
  }
`

// Volt's `OrderAppQuery_order`, without the fields that resolve on MP types
// (artwork, artworkOrEditionSet, artworkVersion, buyerProfile)
const VOLT_ORDER = `
  code
  id
  impulseConversationId
  ... on CommerceOfferOrder {
    isInquiryOrder
    awaitingResponseFrom
    lastOffer {
      amount(decimal: ".", precision: 2)
      definesTotal
      hasDefiniteTotal
      id
      offerAmountChanged
    }
    offers {
      edges {
        node {
          id
          amount(decimal: ".", precision: 2)
          createdAt
          fromParticipant
          note
          respondsTo {
            id
          }
        }
      }
    }
  }
  paymentMethod
  mode
  listPrice: totalListPrice(decimal: ".", precision: 2)
  totalListPriceCents
  currencyCode
  state
  stateReason
  price: itemsTotal(decimal: ".", precision: 2)
  itemsTotalCents
  shipping: shippingTotal(decimal: ".", precision: 2)
  shippingTotalCents
  shippingRadius
  tax: taxTotal(decimal: ".", precision: 2)
  taxTotalCents
  taxTypes
  artsyCollectsTaxes
  artsyRemitsTaxes
  artsyTotal: artsyTotal(decimal: ".", precision: 2)
  buyerTotal: buyerTotal(decimal: ".", precision: 2)
  artsyFee: commissionFee(decimal: ".", precision: 2)
  commissionFeeCents
  processingFee: transactionFee(decimal: ".", precision: 2)
  transactionFeeCents
  sellerTotal: sellerTotal(decimal: ".", precision: 2)
  artsyRate: displayCommissionRate
  stateExpiresAt
  stateUpdatedAt
  lastSubmittedAt
  lastApprovedAt
  lastTransactionFailed
  lastTransactionFailureCode
  displayState
  requestedFulfillment {
    __typename
    ... on CommerceShipArta {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
      phoneNumber
    }
  }
  lineItems {
    edges {
      node {
        id
        selectedShippingQuote {
          tier
          typeName
        }
        fulfillments {
          edges {
            node {
              courier
              trackingId
              estimatedDelivery
            }
          }
        }
        shipment {
          status
          trackingUrl
          carrierName
          trackingNumber
          deliveryStart
          deliveryEnd
          contactName
          contactPhone
          contactEmail
          labelUrl
        }
      }
    }
  }
`

const sellerMutation = (
  field: string,
  input: string,
  order = VOLT_ORDER
) => gql`
  mutation {
    ${field}(input: ${input}) {
      orderOrError {
        __typename
        ... on CommerceOrderWithMutationSuccess {
          order {
            ${order}
          }
        }
        ... on CommerceOrderWithMutationFailure {
          error {
            type
            code
            data
          }
        }
      }
    }
  }
`

describe("Exchange REST writes", () => {
  const originalFlag = config.EXCHANGE_REST_WRITES
  let schema

  // The REST-backed mutations are added when the schema is built with the flag on
  beforeAll(async () => {
    config.EXCHANGE_REST_WRITES = true
    schema = await getExchangeMergedSchema()
  })

  beforeEach(() => {
    config.EXCHANGE_REST_WRITES = true
    mockDelegateToExchange.mockReset().mockResolvedValue(null)
  })

  afterEach(() => {
    config.EXCHANGE_REST_WRITES = originalFlag
  })

  const buildContext = (overrides = {}) => ({
    defaultTimezone: "America/New_York",
    userID: "user-id",
    conversationLoader: jest.fn().mockResolvedValue({ id: "conversation-id" }),
    conversationCreateConversationOrderLoader: jest.fn().mockResolvedValue({}),
    buyerOfferActionLoader: jest.fn().mockResolvedValue(buyerOrder),
    meOrderCreateLoader: jest.fn().mockResolvedValue(createdOrder),
    sellerOfferActionLoader: jest.fn().mockResolvedValue(sellerOrder),
    sellerOrderActionLoader: jest.fn().mockResolvedValue(sellerOrder),
    ...overrides,
  })

  const runMutation = (source: string, context, variableValues = {}) =>
    graphql({ schema, source, contextValue: context, variableValues })

  const createMutation = (field: string, input: string) => gql`
    mutation {
      ${field}(input: ${input}) {
        ${ORDER_OR_ERROR}
      }
    }
  `

  const orderOrError = (result, field: string) =>
    (result.data as any)?.[field]?.orderOrError

  describe("order creation", () => {
    it("delegates to Exchange GraphQL when the flag is off", async () => {
      config.EXCHANGE_REST_WRITES = false
      const context = buildContext()

      await runMutation(
        createMutation(
          "commerceCreateOrderWithArtwork",
          `{ artworkId: "artwork-id" }`
        ),
        context
      )

      expect(context.meOrderCreateLoader).not.toHaveBeenCalled()
      expect(mockDelegateToExchange).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: "commerceCreateOrderWithArtwork" })
      )
    })

    it.each([
      [
        "commerceCreateOrderWithArtwork",
        `{ artworkId: "artwork-id", editionSetId: "edition-set-id" }`,
        {
          artwork_id: "artwork-id",
          edition_set_id: "edition-set-id",
          mode: "buy",
          quantity: 1,
        },
      ],
      [
        "commerceCreateOfferOrderWithArtwork",
        `{ artworkId: "artwork-id", quantity: 2, findActiveOrCreate: false, partnerOfferId: "partner-offer-id" }`,
        {
          artwork_id: "artwork-id",
          find_active_or_create: false,
          mode: "offer",
          partner_offer_id: "partner-offer-id",
          quantity: 2,
        },
      ],
      [
        "commerceCreateOfferOrderWithArtwork",
        `{ artworkId: "artwork-id" }`,
        {
          artwork_id: "artwork-id",
          find_active_or_create: true,
          mode: "offer",
          quantity: 1,
        },
      ],
      [
        "commerceCreatePartnerOfferOrder",
        `{ partnerOfferId: "partner-offer-id", impulseConversationId: "conversation-id" }`,
        {
          impulse_conversation_id: "conversation-id",
          mode: "buy",
          partner_offer_id: "partner-offer-id",
          quantity: 1,
        },
      ],
    ])("%s posts the order to Exchange REST", async (field, input, params) => {
      const context = buildContext()

      const result = await runMutation(createMutation(field, input), context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderCreateLoader).toHaveBeenCalledWith(params)
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
      expect(orderOrError(result, field)).toEqual({
        __typename: "CommerceOrderWithMutationSuccess",
        order: { internalID: "new-order-id", mode: "BUY" },
      })
    })

    it.each([
      [
        "createInquiryOrder",
        `{ artworkId: "artwork-id", impulseConversationId: "conversation-id" }`,
        { mode: "buy" },
      ],
      [
        "createInquiryOfferOrder",
        `{ artworkId: "artwork-id", impulseConversationId: "conversation-id" }`,
        { find_active_or_create: true, mode: "offer" },
      ],
    ])(
      "%s posts the order and links it to the conversation",
      async (field, input, params) => {
        const context = buildContext()

        const result = await runMutation(createMutation(field, input), context)

        expect(result.errors).toBeUndefined()
        expect(context.conversationLoader).toHaveBeenCalledWith(
          "conversation-id"
        )
        expect(context.meOrderCreateLoader).toHaveBeenCalledWith({
          artwork_id: "artwork-id",
          impulse_conversation_id: "conversation-id",
          quantity: 1,
          ...params,
        })
        expect(
          context.conversationCreateConversationOrderLoader
        ).toHaveBeenCalledWith({
          conversation_id: "conversation-id",
          exchange_order_id: "new-order-id",
        })
        expect(orderOrError(result, field).order.internalID).toEqual(
          "new-order-id"
        )
      }
    )

    it("doesn't link a failed inquiry order to the conversation", async () => {
      const context = buildContext({
        meOrderCreateLoader: jest.fn().mockRejectedValue(
          new HTTPError("Unprocessable", 422, {
            type: "validation",
            code: "artwork_not_for_sale",
            message: "artwork_not_for_sale",
            data: { artwork_id: "artwork-id" },
          })
        ),
      })

      const result = await runMutation(
        createMutation(
          "createInquiryOrder",
          `{ artworkId: "artwork-id", impulseConversationId: "conversation-id" }`
        ),
        context
      )

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "createInquiryOrder")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: {
          type: "validation",
          code: "artwork_not_for_sale",
          data: '{"artwork_id":"artwork-id"}',
        },
      })
      expect(
        context.conversationCreateConversationOrderLoader
      ).not.toHaveBeenCalled()
    })

    it("returns a failure with stringified data for a 422", async () => {
      const context = buildContext({
        meOrderCreateLoader: jest.fn().mockRejectedValue(
          new HTTPError(
            "Unprocessable",
            422,
            JSON.stringify({
              type: "validation",
              code: "unpublished_artwork",
              message: "unpublished_artwork",
            })
          )
        ),
      })

      const result = await runMutation(
        createMutation(
          "commerceCreateOrderWithArtwork",
          `{ artworkId: "artwork-id" }`
        ),
        context
      )

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceCreateOrderWithArtwork")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: {
          type: "validation",
          code: "unpublished_artwork",
          data: "null",
        },
      })
    })

    it("throws for a 400", async () => {
      const context = buildContext({
        meOrderCreateLoader: jest.fn().mockRejectedValue(
          new HTTPError("Bad Request", 400, {
            type: "param_error",
            message: "Invalid parameters.",
          })
        ),
      })

      const result = await runMutation(
        createMutation(
          "commerceCreateOrderWithArtwork",
          `{ artworkId: "artwork-id" }`
        ),
        context
      )

      expect(result.errors?.[0].message).toEqual("Bad Request")
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
    })

    it("delegates when a field REST doesn't return is selected", async () => {
      const context = buildContext()

      await runMutation(
        gql`
          mutation {
            commerceCreateOrderWithArtwork(input: { artworkId: "artwork-id" }) {
              orderOrError {
                ... on CommerceOrderWithMutationSuccess {
                  order {
                    internalID
                    # Details-only: not in the created order JSON
                    displayState
                  }
                }
              }
            }
          }
        `,
        context
      )

      expect(context.meOrderCreateLoader).not.toHaveBeenCalled()
      expect(mockDelegateToExchange).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: "commerceCreateOrderWithArtwork" })
      )
    })
  })

  describe("seller actions", () => {
    it.each([
      [
        "commerceApproveOrder",
        `{ id: "order-id", shippingContact: { name: "Gallery", phone: "555", email: "g@example.com" } }`,
        "sellerOrderActionLoader",
        { orderId: "order-id", action: "approve" },
        {
          shipping_contact: {
            email: "g@example.com",
            name: "Gallery",
            phone: "555",
          },
        },
      ],
      [
        "commerceFulfillAtOnce",
        `{ id: "order-id", fulfillment: { courier: "UPS", trackingId: "1Z999", estimatedDelivery: "2026-11-30" } }`,
        "sellerOrderActionLoader",
        { orderId: "order-id", action: "fulfill_at_once" },
        {
          fulfillment: {
            courier: "UPS",
            estimated_delivery: "2026-11-30",
            tracking_id: "1Z999",
          },
        },
      ],
      [
        "commerceConfirmPickup",
        `{ id: "order-id" }`,
        "sellerOrderActionLoader",
        { orderId: "order-id", action: "confirm_pickup" },
        {},
      ],
      [
        "commerceSellerAcceptOffer",
        `{ offerId: "offer-1" }`,
        "sellerOfferActionLoader",
        { offerId: "offer-1", action: "accept" },
        {},
      ],
      [
        "commerceSellerAcceptProvisionalOffer",
        `{ offerId: "offer-1", shippingTotalCents: 0 }`,
        "sellerOfferActionLoader",
        { offerId: "offer-1", action: "accept_provisional" },
        { shipping_total_cents: 0 },
      ],
      [
        "commerceSellerCounterOffer",
        `{ offerId: "offer-1", amountCents: 90000, note: "Best I can do" }`,
        "sellerOfferActionLoader",
        { offerId: "offer-1", action: "counter" },
        { amount_cents: 90000, note: "Best I can do" },
      ],
      [
        "commerceSellerRejectOffer",
        `{ offerId: "offer-1", rejectReason: SELLER_REJECTED_OFFER_TOO_LOW }`,
        "sellerOfferActionLoader",
        { offerId: "offer-1", action: "reject" },
        { reject_reason: "seller_rejected_offer_too_low" },
      ],
    ])(
      "%s posts to Exchange REST",
      async (field, input, loader, key, params) => {
        const context = buildContext()

        const result = await runMutation(
          sellerMutation(field, input, "internalID"),
          context
        )

        expect(result.errors).toBeUndefined()
        expect(context[loader]).toHaveBeenCalledWith(key, params)
        expect(mockDelegateToExchange).not.toHaveBeenCalled()
        expect(orderOrError(result, field)).toEqual({
          __typename: "CommerceOrderWithMutationSuccess",
          order: { internalID: "order-id" },
        })
      }
    )

    it("resolves Volt's order fields from the seller order", async () => {
      const context = buildContext()

      const result = await runMutation(
        sellerMutation("commerceApproveOrder", `{ id: "order-id" }`),
        context
      )

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceApproveOrder")).toEqual({
        __typename: "CommerceOrderWithMutationSuccess",
        order: {
          code: "O123",
          id: "order-id",
          impulseConversationId: "conversation-id",
          isInquiryOrder: true,
          awaitingResponseFrom: null,
          lastOffer: {
            amount: "$900.00",
            definesTotal: true,
            hasDefiniteTotal: true,
            id: "offer-2",
            offerAmountChanged: true,
          },
          offers: {
            edges: [
              {
                node: {
                  id: "offer-2",
                  amount: "$900.00",
                  createdAt: "2026-11-02T05:00:00-05:00",
                  fromParticipant: "SELLER",
                  note: null,
                  respondsTo: { id: "offer-1" },
                },
              },
              {
                node: {
                  id: "offer-1",
                  amount: "$800.00",
                  createdAt: "2026-11-01T05:00:00-05:00",
                  fromParticipant: "BUYER",
                  note: "Would you take less?",
                  respondsTo: null,
                },
              },
            ],
          },
          paymentMethod: "CREDIT_CARD",
          mode: "OFFER",
          listPrice: "$1,000.00",
          totalListPriceCents: 100000,
          currencyCode: "USD",
          state: "APPROVED",
          stateReason: null,
          price: "$900.00",
          itemsTotalCents: 90000,
          shipping: "$25.00",
          shippingTotalCents: 2500,
          shippingRadius: null,
          tax: "$0.00",
          taxTotalCents: 0,
          taxTypes: ["SALES_TAX"],
          artsyCollectsTaxes: true,
          artsyRemitsTaxes: false,
          artsyTotal: "$150.00",
          buyerTotal: "$925.00",
          artsyFee: "$135.00",
          commissionFeeCents: 13500,
          processingFee: "$15.00",
          transactionFeeCents: 1500,
          sellerTotal: "$750.00",
          artsyRate: "15%",
          stateExpiresAt: "2026-11-05T10:30:00-05:00",
          stateUpdatedAt: "2026-11-02T05:00:00-05:00",
          lastSubmittedAt: "2026-11-01T05:00:00-05:00",
          lastApprovedAt: "2026-11-03T05:00:00-05:00",
          lastTransactionFailed: false,
          lastTransactionFailureCode: null,
          displayState: "PROCESSING",
          requestedFulfillment: {
            __typename: "CommerceShipArta",
            name: "Dr Collector",
            addressLine1: "401 Broadway",
            addressLine2: "Floor 25",
            city: "New York",
            region: "NY",
            country: "US",
            postalCode: "10013",
            phoneNumber: "555-555-5555",
          },
          lineItems: {
            edges: [
              {
                node: {
                  id: "line-item-id",
                  selectedShippingQuote: {
                    tier: "standard",
                    typeName: "ground",
                  },
                  fulfillments: {
                    edges: [
                      {
                        node: {
                          courier: "UPS",
                          trackingId: "1Z999",
                          // Same date transform as on the GraphQL path
                          estimatedDelivery: "2026-11-29T19:00:00-05:00",
                        },
                      },
                    ],
                  },
                  shipment: {
                    status: "confirmed",
                    trackingUrl: "https://example.com/track",
                    carrierName: "ARTA",
                    trackingNumber: "ARTA1",
                    deliveryStart: "2026-12-04T04:00:00-05:00",
                    deliveryEnd: "2026-12-05T12:00:00-05:00",
                    contactName: "Gallery",
                    contactPhone: "555-000-0000",
                    contactEmail: "gallery@example.com",
                    labelUrl: "https://example.com/label.pdf",
                  },
                },
              },
            ],
          },
        },
      })
    })

    it("serves Volt's full order fragment from REST", async () => {
      const context = buildContext()

      // Fields on MP types (artwork, buyerProfile…) resolve on MP, and fail
      // here without their loaders; what matters is that REST was used.
      await runMutation(
        sellerMutation(
          "commerceApproveOrder",
          `{ id: "order-id" }`,
          `${VOLT_ORDER}
          buyerProfile {
            name
            email
          }
          lineItems {
            edges {
              node {
                artwork {
                  internalID
                }
                artworkOrEditionSet {
                  __typename
                }
                artworkVersion {
                  title
                }
              }
            }
          }`
        ),
        context
      )

      expect(context.sellerOrderActionLoader).toHaveBeenCalled()
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
    })

    it("returns a not_found failure for a 404", async () => {
      const context = buildContext({
        sellerOfferActionLoader: jest
          .fn()
          .mockRejectedValue(
            new HTTPError("Not Found", 404, { errors: ["Not found"] })
          ),
      })

      const result = await runMutation(
        sellerMutation(
          "commerceSellerAcceptOffer",
          `{ offerId: "offer-1" }`,
          "internalID"
        ),
        context
      )

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceSellerAcceptOffer")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: { type: "validation", code: "not_found", data: "null" },
      })
    })

    it("delegates when myLastOffer is selected, which seller routes lack", async () => {
      const context = buildContext()

      await runMutation(
        sellerMutation(
          "commerceSellerCounterOffer",
          `{ offerId: "offer-1", amountCents: 90000 }`,
          "... on CommerceOfferOrder { myLastOffer { internalID } }"
        ),
        context
      )

      expect(context.sellerOfferActionLoader).not.toHaveBeenCalled()
      expect(mockDelegateToExchange).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: "commerceSellerCounterOffer" })
      )
    })

    it("delegates when a field the seller order lacks is selected", async () => {
      const context = buildContext()

      await runMutation(
        sellerMutation(
          "commerceConfirmPickup",
          `{ id: "order-id" }`,
          // Buyer-only: not in the seller order JSON
          "creditCardId"
        ),
        context
      )

      expect(context.sellerOrderActionLoader).not.toHaveBeenCalled()
      expect(mockDelegateToExchange).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: "commerceConfirmPickup" })
      )
    })
  })

  describe("buyer offer actions", () => {
    const unprocessable = (body: Record<string, unknown>) =>
      jest
        .fn()
        .mockRejectedValue(
          new HTTPError("Unprocessable", 422, JSON.stringify(body))
        )

    it.each([
      [
        "commerceBuyerAcceptOffer",
        FORCE_BUYER_ACCEPT_OFFER,
        { offerId: "offer-2" },
        "accept",
        {},
      ],
      [
        "commerceBuyerRejectOffer",
        FORCE_BUYER_REJECT_OFFER,
        { offerId: "offer-2", rejectReason: "BUYER_REJECTED" },
        "reject",
        { reject_reason: "buyer_rejected" },
      ],
    ])(
      "%s posts Force's mutation to Exchange REST",
      async (field, source, input, action, params) => {
        const context = buildContext()

        const result = await runMutation(source, context, { input })

        expect(result.errors).toBeUndefined()
        expect(context.buyerOfferActionLoader).toHaveBeenCalledWith(
          { offerId: "offer-2", action },
          params
        )
        expect(mockDelegateToExchange).not.toHaveBeenCalled()
        expect(orderOrError(result, field)).toEqual({
          __typename: "CommerceOrderWithMutationSuccess",
          order: {
            __typename: "CommerceOfferOrder",
            internalID: "order-id",
            awaitingResponseFrom: null,
            id: "order-id",
          },
        })
      }
    )

    it("commerceSubmitPendingOffer posts Force's mutation to Exchange REST", async () => {
      const context = buildContext({
        buyerOfferActionLoader: jest.fn().mockResolvedValue({
          ...buyerOrder,
          state: "submitted",
          awaiting_response_from: "seller",
        }),
      })

      const result = await runMutation(FORCE_SUBMIT_PENDING_OFFER, context, {
        input: { offerId: "offer-3" },
      })

      expect(result.errors).toBeUndefined()
      expect(context.buyerOfferActionLoader).toHaveBeenCalledWith(
        { offerId: "offer-3", action: "submit" },
        {}
      )
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
      expect(orderOrError(result, "commerceSubmitPendingOffer")).toEqual({
        __typename: "CommerceOrderWithMutationSuccess",
        order: {
          __typename: "CommerceOfferOrder",
          state: "SUBMITTED",
          awaitingResponseFrom: "SELLER",
          id: "order-id",
        },
      })
    })

    it("commerceBuyerCounterOffer posts the counteroffer to Exchange REST", async () => {
      const context = buildContext()

      const result = await runMutation(
        sellerMutation(
          "commerceBuyerCounterOffer",
          `{ offerId: "offer-2", amountCents: 85000, note: "Meet halfway?" }`,
          "internalID displayState"
        ),
        context
      )

      expect(result.errors).toBeUndefined()
      expect(context.buyerOfferActionLoader).toHaveBeenCalledWith(
        { offerId: "offer-2", action: "counter" },
        { amount_cents: 85000, note: "Meet halfway?" }
      )
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
      expect(orderOrError(result, "commerceBuyerCounterOffer")).toEqual({
        __typename: "CommerceOrderWithMutationSuccess",
        order: { internalID: "order-id", displayState: "PROCESSING" },
      })
    })

    it("serves Force's counteroffer, with myLastOffer from my_last_offer", async () => {
      // The buyer's pending counteroffer: not submitted, so not in
      // `submitted_offers`
      const pendingCounter = {
        ...buyerOffer,
        id: "offer-3",
        amount_cents: 85000,
        created_at: "2026-11-03T10:00:00Z",
        note: "Meet halfway?",
        responds_to_id: "offer-2",
        submitted_at: null,
      }
      const context = buildContext({
        buyerOfferActionLoader: jest
          .fn()
          .mockResolvedValue({ ...buyerOrder, my_last_offer: pendingCounter }),
      })

      const result = await runMutation(
        gql`
          mutation RespondCounterOfferMutation(
            $input: CommerceBuyerCounterOfferInput!
          ) {
            commerceBuyerCounterOffer(input: $input) {
              orderOrError {
                ... on CommerceOrderWithMutationSuccess {
                  order {
                    internalID
                    ... on CommerceOfferOrder {
                      myLastOffer {
                        createdAt
                        id
                        internalID
                        note
                        submittedAt
                        respondsTo {
                          internalID
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        context,
        {
          input: {
            offerId: "offer-2",
            amountCents: 85000,
            note: "Meet halfway?",
          },
        }
      )

      expect(result.errors).toBeUndefined()
      expect(context.buyerOfferActionLoader).toHaveBeenCalledWith(
        { offerId: "offer-2", action: "counter" },
        { amount_cents: 85000, note: "Meet halfway?" }
      )
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
      expect(orderOrError(result, "commerceBuyerCounterOffer")).toEqual({
        order: {
          internalID: "order-id",
          myLastOffer: {
            createdAt: "2026-11-03T05:00:00-05:00",
            id: "offer-3",
            internalID: "offer-3",
            note: "Meet halfway?",
            submittedAt: null,
            respondsTo: { internalID: "offer-2" },
          },
        },
      })
    })

    it("returns the requires-action member when the payment needs SCA", async () => {
      const context = buildContext({
        buyerOfferActionLoader: unprocessable({
          type: "processing",
          code: "payment_requires_action",
          action_data: { client_secret: "pi_secret" },
        }),
      })

      const result = await runMutation(FORCE_BUYER_ACCEPT_OFFER, context, {
        input: { offerId: "offer-2" },
      })

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceBuyerAcceptOffer")).toEqual({
        __typename: "CommerceOrderRequiresAction",
        actionData: { clientSecret: "pi_secret" },
      })
    })

    it("returns a failure with the processing error's data for a 422", async () => {
      const context = buildContext({
        buyerOfferActionLoader: unprocessable({
          type: "processing",
          code: "capture_failed",
          message: "capture_failed",
          data: { decline_code: "insufficient_funds" },
        }),
      })

      const result = await runMutation(FORCE_BUYER_ACCEPT_OFFER, context, {
        input: { offerId: "offer-2" },
      })

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceBuyerAcceptOffer")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: {
          type: "processing",
          code: "capture_failed",
          data: '{"decline_code":"insufficient_funds"}',
        },
      })
    })

    it("only returns the requires-action member from accept", async () => {
      const context = buildContext({
        buyerOfferActionLoader: unprocessable({
          type: "processing",
          code: "payment_requires_action",
          action_data: { client_secret: "pi_secret" },
        }),
      })

      const result = await runMutation(FORCE_SUBMIT_PENDING_OFFER, context, {
        input: { offerId: "offer-3" },
      })

      expect(orderOrError(result, "commerceSubmitPendingOffer")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: {
          type: "processing",
          code: "payment_requires_action",
          data: "null",
        },
      })
    })

    it("returns a not_found failure for a 404", async () => {
      const context = buildContext({
        buyerOfferActionLoader: jest
          .fn()
          .mockRejectedValue(
            new HTTPError("Not Found", 404, { errors: ["Not found"] })
          ),
      })

      const result = await runMutation(FORCE_BUYER_REJECT_OFFER, context, {
        input: { offerId: "offer-2" },
      })

      expect(result.errors).toBeUndefined()
      expect(orderOrError(result, "commerceBuyerRejectOffer")).toEqual({
        __typename: "CommerceOrderWithMutationFailure",
        error: { type: "validation", code: "not_found", data: "null" },
      })
    })

    it("still ignores requires-action selections on mutations that can't return it", async () => {
      const context = buildContext()

      const result = await runMutation(
        gql`
          mutation {
            commerceSellerAcceptOffer(input: { offerId: "offer-1" }) {
              orderOrError {
                ... on CommerceOrderWithMutationSuccess {
                  order {
                    internalID
                  }
                }
                ... on CommerceOrderRequiresAction {
                  actionData {
                    clientSecret
                  }
                }
              }
            }
          }
        `,
        context
      )

      expect(result.errors).toBeUndefined()
      expect(context.sellerOfferActionLoader).toHaveBeenCalled()
      expect(mockDelegateToExchange).not.toHaveBeenCalled()
    })
  })
})
