import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "./support"

let context
let orderJson

describe("DisplayTexts", () => {
  beforeEach(() => {
    orderJson = {
      ...baseOrderJson,
      id: "order-id",
      mode: "buy",
      currency_code: "USD",
      buyer_state: "submitted",
      fulfillment_type: "ship",
    }
  })

  const query = gql`
    query {
      me {
        order(id: "order-id") {
          displayTexts {
            title
            messageType
            stateName
            actionPrompt
          }
        }
      }
    }
  `

  describe("buyer_state: submitted", () => {
    it("returns correct display texts for buy order", async () => {
      orderJson.mode = "buy"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Great choice!",
        messageType: "SUBMITTED_ORDER",
        stateName: "Submitted",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for offer order", async () => {
      orderJson.mode = "offer"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Great choice!",
        messageType: "SUBMITTED_OFFER",
        stateName: "Submitted",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: offer_received", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "offer_received"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Great choice!",
        messageType: "OFFER_RECEIVED",
        stateName: "Counteroffer received",
        actionPrompt: "Respond to Counteroffer",
      })
    })
  })

  describe("buyer_state: payment_failed", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "payment_failed"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Payment failed",
        messageType: "PAYMENT_FAILED",
        stateName: "Payment failed",
        actionPrompt: "Update Payment Method",
      })
    })
  })

  describe("buyer_state: processing_payment", () => {
    it("returns correct display texts for pickup", async () => {
      orderJson.buyer_state = "processing_payment"
      orderJson.fulfillment_type = "pickup"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your payment is processing",
        messageType: "PROCESSING_PAYMENT_PICKUP",
        stateName: "Payment processing",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for shipping", async () => {
      orderJson.buyer_state = "processing_payment"
      orderJson.fulfillment_type = "ship"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your payment is processing",
        messageType: "PROCESSING_PAYMENT_SHIP",
        stateName: "Payment processing",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: processing_offline_payment", () => {
    it("returns correct display texts for USD", async () => {
      orderJson.buyer_state = "processing_offline_payment"
      orderJson.currency_code = "USD"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "PROCESSING_WIRE",
        stateName: "Confirmed",
        actionPrompt: "Complete payment",
      })
    })
  })

  describe("buyer_state: approved", () => {
    it("returns correct display texts for pickup", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "pickup"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_PICKUP",
        stateName: "Confirmed",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for standard shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = {
        type: "artsy_standard",
        amount_minor: 2344,
      }
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_STANDARD",
        stateName: "Confirmed",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for express shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = {
        type: "artsy_express",
        amount_minor: 123,
      }
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_EXPRESS",
        stateName: "Confirmed",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for white glove shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = {
        type: "artsy_white_glove",
        amount_minor: 456,
      }
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_WHITE_GLOVE",
        stateName: "Confirmed",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for default shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = { type: "other", amount_minor: 0 }
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP",
        stateName: "Confirmed",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: shipped", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "shipped"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Good news, your order has shipped!",
        messageType: "SHIPPED",
        stateName: "Shipped",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: completed", () => {
    it("returns correct display texts for pickup", async () => {
      orderJson.buyer_state = "completed"
      orderJson.fulfillment_type = "pickup"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order has been picked up",
        messageType: "COMPLETED_PICKUP",
        stateName: "Completed",
        actionPrompt: null,
      })
    })

    it("returns correct display texts for shipping", async () => {
      orderJson.buyer_state = "completed"
      orderJson.fulfillment_type = "ship"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order has been delivered",
        messageType: "COMPLETED_SHIP",
        stateName: "Completed",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: canceled", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "canceled"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order was canceled",
        messageType: "CANCELED",
        stateName: "Canceled",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: refunded", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "refunded"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order was canceled and refunded",
        messageType: "REFUNDED",
        stateName: "Canceled",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: declined_by_buyer", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "declined_by_buyer"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "You declined the offer",
        messageType: "DECLINED_BY_BUYER",
        stateName: "Canceled",
        actionPrompt: null,
      })
    })
  })

  describe("buyer_state: declined_by_seller", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "declined_by_seller"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your offer was declined",
        messageType: "DECLINED_BY_SELLER",
        stateName: "Canceled",
        actionPrompt: null,
      })
    })
  })

  describe("unknown buyer_state", () => {
    it("returns default display texts", async () => {
      orderJson.buyer_state = "unknown_state"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order",
        messageType: "UNKNOWN",
        stateName: "Unknown",
        actionPrompt: null,
      })
    })
  })
})
