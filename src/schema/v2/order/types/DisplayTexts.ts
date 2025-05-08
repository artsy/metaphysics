import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import type { ResolverContext } from "types/graphql"
import { OrderJSON } from "./exchangeJson"
import { formatMarkdownValue } from "../../fields/markdown"
import { FormatEnums } from "../../input_fields/format"

const DisplayTextsType = new GraphQLObjectType<any, ResolverContext>({
  name: "DisplayTexts",
  description:
    "Display texts for the order based on its state and order shipping/payment states",
  fields: {
    titleText: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Title text to display for the order",
    },
    messageText: {
      type: GraphQLString,
      description: "First paragraph of the message text for the order",
      args: {
        format: {
          type: FormatEnums,
          defaultValue: "markdown",
        },
      },
      resolve: ({ messageText }, { format }) => {
        if (!messageText) return null
        return formatMarkdownValue(messageText, format)
      },
    },
  },
})

export const DisplayTexts: GraphQLFieldConfig<OrderJSON, ResolverContext> = {
  description:
    "Display texts for the order based on its buyer_state and order shipping/payment states",
  type: new GraphQLNonNull(DisplayTextsType),
  resolve: (order) => resolveDisplayTexts(order),
}

const formatMessage = (parts: string[]) => parts.join("<br/><br/>")
const resolveDisplayTexts = (order: OrderJSON) => {
  const isPickup = order.fulfillment_type == "pickup"

  switch (order.buyer_state) {
    case "submitted":
      return {
        titleText: "Great choice!",
        messageText: formatMessage([
          "Thank you! Your order is being processed.<br/>You will receive an email shortly with all the details.",
        ]),
      }
    case "payment_failed":
      return {
        titleText: "Payment failed",
        messageText: formatMessage([
          "To complete your purchase, please update your payment details or provide an alternative payment method.",
        ]),
      }
    case "processing_payment":
      return {
        titleText: "Your payment is processing",
        messageText: formatMessage([
          `Thank you for your purchase. You will be notified when the work ${
            isPickup ? "is available for pickup" : "has shipped"
          }.`,
        ]),
      }
    case "processing_offline_payment":
      return {
        titleText: "Congratulations!",
        messageText: formatMessage([
          "Your order has been confirmed. Thank you for your purchase.",
        ]),
      }
    case "approved":
      return {
        titleText: "Congratulations!",
        messageText: formatMessage([
          isPickup
            ? "Thank you for your purchase. A specialist will contact you within 2 business days to coordinate pickup. You can <a href='#' data-link='contact-gallery'>contact the gallery</a> with any questions about your order."
            : "Your order has been confirmed. Thank you for your purchase.",
        ]),
      }
    case "shipped":
      return {
        titleText: "Good news, your order has shipped!",
        messageText: formatMessage(["Your work is on its way."]),
      }
    case "completed":
      return {
        titleText: isPickup
          ? "Your order has been picked up"
          : "Your order has been delivered",
        messageText: formatMessage([
          "We hope you love your purchase! Your feedback is valuable—share any thoughts with us at orders@artsy.net.",
        ]),
      }
    case "canceled_and_refunded":
      return {
        titleText: "Your order was canceled",
      }
    default:
      return {
        titleText: "Your order",
      }
  }
}
