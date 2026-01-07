import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "./support"

let context
let orderJson

describe("DisplaySellerTexts", () => {
  beforeEach(() => {
    orderJson = {
      ...baseOrderJson,
      id: "order-id",
      mode: "buy",
      currency_code: "USD",
      seller_state: "order_received",
    }
  })

  const query = gql`
    query {
      me {
        order(id: "order-id") {
          displaySellerTexts {
            conversationStateTitle
            stateName
            actionPrompt
            icon
            isPrimaryAction
          }
        }
      }
    }
  `

  describe("seller_state: incomplete", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "incomplete"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "",
        stateName: "Incomplete",
        actionPrompt: null,
        icon: null,
        isPrimaryAction: null,
      })
    })
  })

  describe("seller_state: order_received", () => {
    it("returns correct display texts for buy order", async () => {
      orderJson.mode = "buy"
      orderJson.seller_state = "order_received"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order received",
        stateName: "Order received",
        actionPrompt: "Confirm Order",
        icon: "PendingStrokeIcon",
        isPrimaryAction: true,
      })
    })

    it("returns correct display texts for offer order", async () => {
      orderJson.mode = "offer"
      orderJson.seller_state = "order_received"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order received",
        stateName: "Order received",
        actionPrompt: "Confirm Order",
        icon: "PendingStrokeIcon",
        isPrimaryAction: true,
      })
    })
  })

  describe("seller_state: offer_received", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "offer_received"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Offer received",
        stateName: "Offer received",
        actionPrompt: "Respond to Offer",
        icon: "PendingStrokeIcon",
        isPrimaryAction: true,
      })
    })
  })

  describe("seller_state: offer_sent", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "offer_sent"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Counteroffer sent",
        stateName: "Offer sent",
        actionPrompt: "View Offer Details",
        icon: "PendingStrokeIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: payment_failed", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "payment_failed"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Payment failed",
        stateName: "Payment failed",
        actionPrompt: "View Order Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: processing_payment", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "processing_payment"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Processing payment",
        stateName: "Processing payment",
        actionPrompt: "View Order Details",
        icon: "PendingStrokeIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: approved_pickup", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "approved_pickup"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order approved",
        stateName: "Approved pickup",
        actionPrompt: "Arrange Pickup",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
      })
    })
  })

  describe("seller_state: approved_seller_ship", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "approved_seller_ship"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order approved",
        stateName: "Approved self ship",
        actionPrompt: "Confirm Shipping",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
      })
    })
  })

  describe("seller_state: approved_artsy_self_ship", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "approved_artsy_self_ship"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order approved",
        stateName: "Approved artsy self ship",
        actionPrompt: "Prepare to Ship",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
      })
    })
  })

  describe("seller_state: approved_artsy_ship", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "approved_artsy_ship"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order approved",
        stateName: "Approved artsy full service",
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: in_transit", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "in_transit"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Shipped",
        stateName: "In transit",
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: completed", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "completed"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Completed",
        stateName: "Completed",
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: refunded", () => {
    it("returns correct display texts", async () => {
      orderJson.seller_state = "refunded"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Refunded",
        stateName: "Refunded",
        actionPrompt: "View Order Details",
        icon: "MoneyBackIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: expired", () => {
    it("returns correct display texts for buy order", async () => {
      orderJson.mode = "buy"
      orderJson.seller_state = "expired"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Order Expired",
        stateName: "Expired",
        actionPrompt: "View Order Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
      })
    })

    it("returns correct display texts for offer order", async () => {
      orderJson.mode = "offer"
      orderJson.seller_state = "expired"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Offer Expired",
        stateName: "Expired",
        actionPrompt: "View Offer Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("seller_state: canceled", () => {
    it("returns correct display texts for buy order", async () => {
      orderJson.mode = "buy"
      orderJson.seller_state = "canceled"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Canceled",
        stateName: "Canceled",
        actionPrompt: "View Order Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
      })
    })

    it("returns correct display texts for offer order", async () => {
      orderJson.mode = "offer"
      orderJson.seller_state = "canceled"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Canceled",
        stateName: "Canceled",
        actionPrompt: "View Offer Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
      })
    })
  })

  describe("unknown seller_state", () => {
    it("returns default display texts", async () => {
      orderJson.seller_state = "unknown_state"
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order.displaySellerTexts).toEqual({
        conversationStateTitle: "Unknown",
        stateName: "Unknown",
        actionPrompt: null,
        icon: null,
        isPrimaryAction: null,
      })
    })
  })
})
