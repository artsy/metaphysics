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
            wireType
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
        wireType: null,
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
        wireType: null,
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
        wireType: null,
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
        wireType: null,
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
        wireType: null,
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
        wireType: "WIRE_USD",
      })
    })

    it("returns correct display texts for GBP", async () => {
      orderJson.buyer_state = "processing_offline_payment"
      orderJson.currency_code = "GBP"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "PROCESSING_WIRE",
        wireType: "WIRE_GBP",
      })
    })

    it("returns correct display texts for EUR", async () => {
      orderJson.buyer_state = "processing_offline_payment"
      orderJson.currency_code = "EUR"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "PROCESSING_WIRE",
        wireType: "WIRE_EUR",
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
        wireType: null,
      })
    })

    it("returns correct display texts for standard shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = "artsy_standard"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_STANDARD",
        wireType: null,
      })
    })

    it("returns correct display texts for express shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = "artsy_express"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_EXPRESS",
        wireType: null,
      })
    })

    it("returns correct display texts for white glove shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = "artsy_white_glove"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP_WHITE_GLOVE",
        wireType: null,
      })
    })

    it("returns correct display texts for default shipping", async () => {
      orderJson.buyer_state = "approved"
      orderJson.fulfillment_type = "ship"
      orderJson.selected_fulfillment_option = "other"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Congratulations!",
        messageType: "APPROVED_SHIP",
        wireType: null,
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
        wireType: null,
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
        wireType: null,
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
        wireType: null,
      })
    })
  })

  describe("buyer_state: canceled_and_refunded", () => {
    it("returns correct display texts", async () => {
      orderJson.buyer_state = "canceled_and_refunded"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displayTexts).toEqual({
        title: "Your order was canceled",
        messageType: "CANCELLED_ORDER",
        wireType: null,
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
        wireType: null,
      })
    })
  })
})
