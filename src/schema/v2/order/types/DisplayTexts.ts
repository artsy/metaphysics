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
import moment from "moment-timezone"

const DisplayTextsType = new GraphQLObjectType<any, ResolverContext>({
  name: "DisplayTexts",
  description:
    "Display texts for the order based on its state and order shipping/payment states",
  fields: {
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Title text to display for the order",
    },
    message: {
      type: GraphQLString,
      description: "First paragraph of the message text for the order",
      args: {
        format: {
          type: FormatEnums,
          defaultValue: "markdown",
        },
      },
      resolve: ({ message }, { format }) => {
        if (!message) return null
        return formatMarkdownValue(message, format)
      },
    },
    // TODO: deprecated - remove after deploy
    titleText: {
      type: GraphQLString,
      description: "deprecated",
    },
    messageText: {
      type: GraphQLString,
      description: "deprecated",
    },
  },
})

export const DisplayTexts: GraphQLFieldConfig<OrderJSON, ResolverContext> = {
  description:
    "Display texts for the order based on its buyer_state and order shipping/payment states",
  type: new GraphQLNonNull(DisplayTextsType),
  resolve: (order) => resolveDisplayTexts(order),
}

const formatMessage = (parts: string[], joinWith = "<br/><br/>") =>
  parts.join(joinWith)

const resolveDisplayTexts = (order: OrderJSON) => {
  const isPickup = order.fulfillment_type == "pickup"
  const stateExpireTime =
    order.buyer_state_expires_at && moment.tz(order.buyer_state_expires_at)
  const formattedStateExpireTime =
    stateExpireTime &&
    `${stateExpireTime.format("MMM D")}, ${stateExpireTime.format("h:mma z")}`

  switch (order.buyer_state) {
    case "submitted": {
      const messageParts = [
        "Thank you! Your order is being processed.<br/>You will receive an email shortly with all the details.",
      ]

      const secondBlockParts: string[] = []
      formattedStateExpireTime &&
        secondBlockParts.push(
          `The gallery will confirm by ${formattedStateExpireTime}.`
        )
      secondBlockParts.push(
        "You can <a href='#' data-link='contact-gallery'>contact the gallery</a> with any questions about your order."
      )

      messageParts.push(formatMessage(secondBlockParts, "<br/>"))

      return {
        title: "Great choice!",
        message: formatMessage(messageParts),
      }
    }
    case "payment_failed":
      return {
        title: "Payment failed",
        message: formatMessage([
          `To complete your purchase, please <a href='#' data-link='update-payment'>update your payment details</a> or provide an alternative payment method by ${formattedStateExpireTime}`,
        ]),
      }
    case "processing_payment":
      return {
        title: "Your payment is processing",
        message: formatMessage([
          `Thank you for your purchase. You will be notified when the work ${
            isPickup ? "is available for pickup" : "has shipped"
          }.`,
        ]),
      }
    case "processing_offline_payment":
      return {
        title: "Congratulations!",
        message: formatMessage([
          "Your order has been confirmed. Thank you for your purchase.",
          "<b>Please proceed with the wire transfer within 7 days to complete your purchase</b><br/><ol><li>Find the total amount due and Artsy's banking details below.</li><li>Please inform your bank that you are responsible for all wire transfer fees.</li><li>Please make the transfer in the currency displayed on the order breakdown and then email proof of payment to orders@artsy.net.</li></ul>",
        ]),
      }
    case "approved": {
      const messageParts = [
        isPickup
          ? "Thank you for your purchase. A specialist will contact you within 2 business days to coordinate pickup. You can <a href='#' data-link='contact-gallery'>contact the gallery</a> with any questions about your order."
          : "Your order has been confirmed. Thank you for your purchase.",
      ]

      if (order.selected_fulfillment_option == "artsy_express")
        messageParts.push(
          "Your order will be processed and packaged, and you will be notified once it ships.<br/>Once shipped, your order will be delivered in 2 business days."
        )
      else if (order.selected_fulfillment_option == "artsy_standard")
        messageParts.push(
          "Your order will be processed and packaged, and you will be notified once it ships.<br/>Once shipped, your order will be delivered in 3-5 business days."
        )
      else if (order.selected_fulfillment_option == "artsy_white_glove")
        messageParts.push(
          "Once shipped, you will receive a notification and further details.<br/>You can contact <a href='#' data-link='contact-orders'>orders@artsy.net</a> with any questions."
        )
      else
        messageParts.push(
          "You will be notified when the work has shipped, typically within 5-7 business days.<br/>You can <a href='#' data-link='contact-gallery'>contact the gallery</a> with any questions about your order."
        )

      return {
        title: "Congratulations!",
        message: formatMessage(messageParts),
      }
    }
    case "shipped": {
      const messageParts = ["Your work is on its way."]
      // TODO: add shipping info when present
      messageParts.push(
        "This artwork will be added to your Collection on Artsy. You can view and manage all your artworks on the Artsy app, available in the <a href='#' data-link='apple-store'>Apple App Store</a> and <a href='#' data-link='google-store'>Google Play Store.</a>"
      )

      return {
        title: "Good news, your order has shipped!",
        message: formatMessage(messageParts),
      }
    }
    case "completed":
      return {
        title: isPickup
          ? "Your order has been picked up"
          : "Your order has been delivered",
        message: formatMessage([
          "We hope you love your purchase! Your feedback is valuable—share any thoughts with us at <a href='#' data-link='contact-orders'>orders@artsy.net.</a>",
          "This artwork will be added to your Collection on Artsy. You can view and manage all your artworks on the Artsy app, available in the <a href='#' data-link='apple-store'>Apple App Store</a> and <a href='#' data-link='google-store'>Google Play Store.</a>",
        ]),
      }
    case "canceled_and_refunded":
      return {
        title: "Your order was canceled",
        message:
          "You can contact <a href='#' data-link='contact-orders'>orders@artsy.net</a> with any questions.",
      }
    default:
      return {
        titlet: "Your order",
      }
  }
}
