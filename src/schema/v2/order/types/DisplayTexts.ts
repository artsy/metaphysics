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
    CANCELLED_ORDER: {
      value: "CANCELLED_ORDER",
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
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Text to display as a first message on the page (header)",
    },
    messageType: {
      type: new GraphQLNonNull(DisplayTextsMessageTypeEnum),
      description:
        "Granular order states specific type that should be directly interpreted by clients",
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
        title: "Great choice!",
        messageType: isBuyOrder ? "SUBMITTED_ORDER" : "SUBMITTED_OFFER",
      }
    }
    case "payment_failed":
      return {
        title: "Payment failed",
        messageType: "PAYMENT_FAILED",
      }
    case "processing_payment":
      return {
        title: "Your payment is processing",
        messageType: isPickup
          ? "PROCESSING_PAYMENT_PICKUP"
          : "PROCESSING_PAYMENT_SHIP",
      }
    case "processing_offline_payment":
      return {
        title: "Congratulations!",
        messageType: "PROCESSING_WIRE",
      }
    case "approved": {
      let messageType = "UNKNOWN"

      if (isPickup) {
        messageType = "APPROVED_PICKUP"
      } else {
        if (order.selected_fulfillment_option == "artsy_express") {
          messageType = "APPROVED_SHIP_EXPRESS"
        } else if (order.selected_fulfillment_option == "artsy_standard") {
          messageType = "APPROVED_SHIP_STANDARD"
        } else if (order.selected_fulfillment_option == "artsy_white_glove") {
          messageType = "APPROVED_SHIP_WHITE_GLOVE"
        } else {
          messageType = "APPROVED_SHIP"
        }
      }

      return {
        title: "Congratulations!",
        messageType: messageType,
      }
    }
    case "shipped": {
      return {
        title: "Good news, your order has shipped!",
        messageType: "SHIPPED",
      }
    }
    case "completed":
      return {
        title: isPickup
          ? "Your order has been picked up"
          : "Your order has been delivered",
        messageType: isPickup ? "COMPLETED_PICKUP" : "COMPLETED_SHIP",
      }
    case "canceled_and_refunded":
      return {
        title: "Your order was canceled",
        messageType: "CANCELLED_ORDER",
      }
    default:
      return {
        title: "Your order",
        messageType: "UNKNOWN",
      }
  }
}
