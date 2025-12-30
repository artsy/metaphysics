import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import type { ResolverContext } from "types/graphql"
import { OrderJSON } from "./exchangeJson"

const DisplaySellerTextsType = new GraphQLObjectType<any, ResolverContext>({
  name: "DisplaySellerTexts",
  description:
    "Display texts for the order based on its seller_state and order shipping states",
  fields: {
    actionPrompt: {
      type: GraphQLString,
      description: "Text prompt for the seller to take action",
    },
    icon: {
      type: GraphQLString,
      description:
        "Icon name to display for the order state (e.g. ClockFillIcon, CheckmarkIcon, CloseStrokeIcon)",
    },
    isPrimaryAction: {
      type: GraphQLBoolean,
      description:
        "Whether the action should be displayed as primary or secondary",
    },
    stateName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Seller facing name for the state",
    },
    conversationStateTitle: {
      type: new GraphQLNonNull(GraphQLString),
      description: "State name for conversation display",
    },
  },
})

export const DisplaySellerTexts: GraphQLFieldConfig<
  OrderJSON,
  ResolverContext
> = {
  description:
    "Display texts for the order based on its seller_state and order shipping states",
  type: new GraphQLNonNull(DisplaySellerTextsType),
  resolve: (order) => resolveDisplaySellerTexts(order),
}

const resolveDisplaySellerTexts = (order: OrderJSON) => {
  const isBuyOrder = order.mode === "buy" ? true : false

  switch (order.seller_state) {
    case "incomplete":
      return {
        stateName: "Incomplete",
        conversationStateTitle: "",
      }
    case "order_received":
      return {
        actionPrompt: "Confirm Order",
        icon: "ClockFillIcon",
        isPrimaryAction: true,
        stateName: "Order received",
        conversationStateTitle: "Order received",
      }
    case "offer_received":
      return {
        actionPrompt: "Respond to Offer",
        icon: "ClockFillIcon",
        isPrimaryAction: true,
        stateName: "Offer received",
        conversationStateTitle: "Offer received",
      }
    case "offer_sent":
      return {
        actionPrompt: "View Offer Details",
        icon: "ClockFillIcon",
        isPrimaryAction: false,
        stateName: "Offer sent",
        conversationStateTitle: "Counteroffer sent",
      }
    case "payment_failed":
      return {
        actionPrompt: "View Order Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
        stateName: "Payment failed",
        conversationStateTitle: "Payment failed",
      }
    case "processing_payment":
      return {
        actionPrompt: "View Order Details",
        icon: "ClockFillIcon",
        isPrimaryAction: false,
        stateName: "Processing payment",
        conversationStateTitle: "Processing payment",
      }
    case "approved_pickup":
      return {
        actionPrompt: "Arrange Pickup",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
        stateName: "Approved pickup",
        conversationStateTitle: "Order approved",
      }
    case "approved_seller_ship":
      return {
        actionPrompt: "Confirm Shipping",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
        stateName: "Approved self ship",
        conversationStateTitle: "Order approved",
      }
    case "approved_artsy_self_ship":
      return {
        actionPrompt: "Prepare to Ship",
        icon: "CheckmarkIcon",
        isPrimaryAction: true,
        stateName: "Approved artsy self ship",
        conversationStateTitle: "Order approved",
      }
    case "approved_artsy_ship":
      return {
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
        stateName: "Approved artsy full service",
        conversationStateTitle: "Order approved",
      }
    case "in_transit":
      return {
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
        stateName: "In transit",
        conversationStateTitle: "Shipped",
      }
    case "completed":
      return {
        actionPrompt: "View Order Details",
        icon: "CheckmarkIcon",
        isPrimaryAction: false,
        stateName: "Completed",
        conversationStateTitle: "Completed",
      }
    case "refunded":
      return {
        actionPrompt: "View Order Details",
        icon: "MoneyBackIcon",
        isPrimaryAction: false,
        stateName: "Refunded",
        conversationStateTitle: "Refunded",
      }
    case "expired":
      return {
        actionPrompt: isBuyOrder ? "View Order Details" : "View Offer Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
        stateName: "Expired",
        conversationStateTitle: isBuyOrder ? "Order Expired" : "Offer Expired",
      }
    case "canceled":
      return {
        actionPrompt: isBuyOrder ? "View Order Details" : "View Offer Details",
        icon: "CloseStrokeIcon",
        isPrimaryAction: false,
        stateName: "Canceled",
        conversationStateTitle: "Canceled",
      }
    default:
      return {
        stateName: "Unknown",
        conversationStateTitle: "Unknown",
      }
  }
}
