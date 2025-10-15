import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
} from "graphql"
import type { ResolverContext } from "types/graphql"
import { OrderJSON } from "./exchangeJson"

const DisplayTextsMessageTypeEnum = new GraphQLEnumType({
  name: "DisplayTextsMessageTypeEnum",
  values: {
    SUBMITTED_ORDER: {
      value: "SUBMITTED_ORDER",
    },
    SUBMITTED_OFFER: {
      value: "SUBMITTED_OFFER",
    },
    OFFER_RECEIVED: {
      value: "OFFER_RECEIVED",
    },
    PAYMENT_FAILED: {
      value: "PAYMENT_FAILED",
    },
    PROCESSING_PAYMENT_PICKUP: {
      value: "PROCESSING_PAYMENT_PICKUP",
    },
    PROCESSING_PAYMENT_SHIP: {
      value: "PROCESSING_PAYMENT_SHIP",
    },
    PROCESSING_WIRE: {
      value: "PROCESSING_WIRE",
    },
    APPROVED_PICKUP: {
      value: "APPROVED_PICKUP",
    },
    APPROVED_SHIP: {
      value: "APPROVED_SHIP",
    },
    APPROVED_SHIP_STANDARD: {
      value: "APPROVED_SHIP_STANDARD",
    },
    APPROVED_SHIP_EXPRESS: {
      value: "APPROVED_SHIP_EXPRESS",
    },
    APPROVED_SHIP_WHITE_GLOVE: {
      value: "APPROVED_SHIP_WHITE_GLOVE",
    },
    SHIPPED: {
      value: "SHIPPED",
    },
    COMPLETED_PICKUP: {
      value: "COMPLETED_PICKUP",
    },
    COMPLETED_SHIP: {
      value: "COMPLETED_SHIP",
    },
    DECLINED_BY_SELLER: {
      value: "DECLINED_BY_SELLER",
    },
    DECLINED_BY_BUYER: {
      value: "DECLINED_BY_BUYER",
    },
    CANCELED: {
      value: "CANCELED",
    },
    REFUNDED: {
      value: "REFUNDED",
    },
    UNKNOWN: {
      value: "UNKNOWN",
    },
  },
})

const DisplayTextsType = new GraphQLObjectType<any, ResolverContext>({
  name: "DisplayTexts",
  description:
    "Display texts for the order based on its state and order shipping/payment states",
  fields: {
    actionPrompt: {
      type: GraphQLString,
      description: "Text prompt for the buyer to take action",
    },
    messageType: {
      type: new GraphQLNonNull(DisplayTextsMessageTypeEnum),
      description:
        "Granular order states specific type that should be directly interpreted by clients",
    },
    stateName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Collector facing name for buyer state",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Text to display as a first message on the page (header)",
    },
  },
})

export const DisplayTexts: GraphQLFieldConfig<OrderJSON, ResolverContext> = {
  description:
    "Display texts for the order based on its buyer_state and order shipping/payment states",
  type: new GraphQLNonNull(DisplayTextsType),
  resolve: (order) => resolveDisplayTexts(order),
}

const resolveDisplayTexts = (order: OrderJSON) => {
  const isBuyOrder = order.mode === "buy" ? true : false
  const isPickup = order.fulfillment_type == "pickup"

  switch (order.buyer_state) {
    case "submitted": {
      return {
        messageType: isBuyOrder ? "SUBMITTED_ORDER" : "SUBMITTED_OFFER",
        stateName: "Submitted",
        title: "Great choice!",
      }
    }
    case "offer_received": {
      return {
        actionPrompt: "Respond to Counteroffer",
        messageType: "OFFER_RECEIVED",
        stateName: "Counteroffer received",
        title: "Great choice!",
      }
    }
    case "payment_failed":
      return {
        actionPrompt: "Update Payment Method",
        messageType: "PAYMENT_FAILED",
        stateName: "Payment failed",
        title: "Payment failed",
      }
    case "processing_payment":
      return {
        messageType: isPickup
          ? "PROCESSING_PAYMENT_PICKUP"
          : "PROCESSING_PAYMENT_SHIP",
        stateName: "Payment processing",
        title: "Your payment is processing",
      }
    case "processing_offline_payment":
      return {
        actionPrompt: "Complete payment",
        messageType: "PROCESSING_WIRE",
        stateName: "Confirmed",
        title: "Congratulations!",
      }
    case "approved": {
      let messageType = "UNKNOWN"

      if (isPickup) {
        messageType = "APPROVED_PICKUP"
      } else {
        if (order.selected_fulfillment_option?.type == "artsy_express") {
          messageType = "APPROVED_SHIP_EXPRESS"
        } else if (
          order.selected_fulfillment_option?.type == "artsy_standard"
        ) {
          messageType = "APPROVED_SHIP_STANDARD"
        } else if (
          order.selected_fulfillment_option?.type == "artsy_white_glove"
        ) {
          messageType = "APPROVED_SHIP_WHITE_GLOVE"
        } else {
          messageType = "APPROVED_SHIP"
        }
      }

      return {
        messageType: messageType,
        stateName: "Confirmed",
        title: "Congratulations!",
      }
    }
    case "shipped": {
      return {
        messageType: "SHIPPED",
        stateName: "Shipped",
        title: "Good news, your order has shipped!",
      }
    }
    case "completed":
      return {
        messageType: isPickup ? "COMPLETED_PICKUP" : "COMPLETED_SHIP",
        stateName: "Completed",
        title: isPickup
          ? "Your order has been picked up"
          : "Your order has been delivered",
      }
    case "declined_by_seller":
      return {
        messageType: "DECLINED_BY_SELLER",
        stateName: "Canceled",
        title: "Your offer was declined",
      }
    case "declined_by_buyer":
      return {
        messageType: "DECLINED_BY_BUYER",
        stateName: "Canceled",
        title: "You declined the offer",
      }
    case "canceled":
      return {
        messageType: "CANCELED",
        stateName: "Canceled",
        title: "Your order was canceled",
      }
    case "refunded":
      return {
        messageType: "REFUNDED",
        stateName: "Canceled",
        title: "Your order was canceled and refunded",
      }
    default:
      return {
        messageType: "UNKNOWN",
        stateName: "Unknown",
        title: "Your order",
      }
  }
}
