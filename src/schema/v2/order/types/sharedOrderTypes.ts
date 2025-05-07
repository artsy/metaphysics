import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../../object_identification"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../../fields/money"
import { ArtworkVersionType } from "../../artwork_version"
import { ArtworkType } from "../../artwork"
import { PartnerType } from "schema/v2/partner/partner"
import { PhoneNumberType, resolvePhoneNumber } from "../../phoneNumber"
import { PricingBreakdownLines } from "./PricingBreakdownLines"
import { OrderJSON } from "./exchangeJson"
import { formatMarkdownValue } from "../../fields/markdown"
import { FormatEnums } from "../../input_fields/format"

const OrderModeEnum = new GraphQLEnumType({
  name: "OrderModeEnum",
  values: {
    BUY: {
      value: "BUY",
    },
    OFFER: {
      value: "OFFER",
    },
  },
})

const OrderSourceEnum = new GraphQLEnumType({
  name: "OrderSourceEnum",
  values: {
    ARTWORK_PAGE: {
      value: "ARTWORK_PAGE",
    },
    INQUIRY: {
      value: "INQUIRY",
    },
    PRIVATE_SALE: {
      value: "PRIVATE_SALE",
    },
    PARTNER_OFFER: {
      value: "PARTNER_OFFER",
    },
  },
})

export const OrderPaymentMethodEnum = new GraphQLEnumType({
  name: "OrderPaymentMethodEnum",
  values: {
    CREDIT_CARD: {
      value: "credit card",
    },
  },
})

export const OrderCreditCardWalletTypeEnum = new GraphQLEnumType({
  name: "OrderCreditCardWalletTypeEnum",
  values: {
    APPLE_PAY: {
      value: "apple_pay",
    },
    GOOGLE_PAY: {
      value: "google_pay",
    },
  },
})

// Enum for fulfillment_option.type field
const FulfillmentOptionTypeEnum = new GraphQLEnumType({
  name: "FulfillmentOptionTypeEnum",
  values: {
    DOMESTIC_FLAT: { value: "DOMESTIC_FLAT" },
    INTERNATIONAL_FLAT: { value: "INTERNATIONAL_FLAT" },
    PICKUP: { value: "PICKUP" },
    SHIPPING_TBD: { value: "SHIPPING_TBD" },
  },
})

type FulfillmentOptionJSONWithCurrencyCode = OrderJSON["fulfillment_options"][number] & {
  _currencyCode: string
}
const FulfillmentOptionType = new GraphQLObjectType<
  FulfillmentOptionJSONWithCurrencyCode,
  ResolverContext
>({
  name: "FulfillmentOption",
  fields: {
    type: {
      type: new GraphQLNonNull(FulfillmentOptionTypeEnum),
      resolve: ({ type }) => {
        if (type === "domestic_flat") return "DOMESTIC_FLAT"
        if (type === "international_flat") return "INTERNATIONAL_FLAT"
        if (type === "pickup") return "PICKUP"
        if (type === "shipping_tbd") return "SHIPPING_TBD"
        throw Error(`Invalid fulfillment option type ${type}`)
      },
    },
    amount: {
      type: Money,
      resolve: (
        // _currencyCode loaded from parent
        { amount_minor: minor, _currencyCode: currencyCode },
        _args,
        context,
        _info
      ) => {
        if (typeof minor !== "number") return null

        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          context,
          _info
        )
      },
    },
    selected: { type: GraphQLBoolean },
  },
})

const FulfillmentDetailsType = new GraphQLObjectType<any, ResolverContext>({
  name: "FulfillmentDetails",
  description: "Buyer fulfillment details for order",
  fields: {
    phoneNumber: {
      type: PhoneNumberType,
      description: "Phone number of the buyer",
      resolve: ({ phoneNumber, phoneNumberCountryCode }) => {
        return resolvePhoneNumber({
          phoneNumber,
          regionCode: phoneNumberCountryCode,
        })
      },
    },
    phoneNumberCountryCode: {
      type: GraphQLString,
      deprecationReason:
        "Use `phoneNumber.regionCode` for the alpha-2 country code or phoneNumber.countryCode for the numeric country code",
      description: "Country code of the buyer's phone number",
    },
    name: {
      type: GraphQLString,
      description: "Name line for shipping address",
    },
    addressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    addressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    city: {
      type: GraphQLString,
      description: "Shipping address city",
    },
    postalCode: {
      type: GraphQLString,
      description: "Shipping address postal code",
    },
    region: {
      type: GraphQLString,
      description: "Shipping address state/province/region",
    },
    country: {
      type: GraphQLString,
      description: "Shipping address country",
    },
  },
})

const LineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "LineItem",
  description: "A line item in an order",
  fields: {
    ...InternalIDFields,
    artwork: {
      type: ArtworkType,
      resolve: ({ artwork_id }, _args, { artworkLoader }) => {
        return artworkLoader(artwork_id)
      },
    },
    artworkVersion: {
      type: ArtworkVersionType,
      resolve: (
        { artwork_version_id },
        _args,
        { authenticatedArtworkVersionLoader }
      ) =>
        authenticatedArtworkVersionLoader
          ? authenticatedArtworkVersionLoader(artwork_version_id)
          : null,
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ currency_code }) => currency_code,
    },
    listPrice: {
      type: Money,
      resolve: async (
        // TODO: Remove USD fallback and include currency_code in the line item json
        { list_price_cents: minor, currency_code: currencyCode = "USD" },
        _args,
        context,
        _info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
          {
            minor: minor,
            currencyCode,
          },
          _args,
          context,
          _info
        )
      },
    },
    quantity: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: ({ quantity }) => quantity,
    },
  },
})

const SellerType = new GraphQLUnionType({
  name: "SellerType",
  types: [PartnerType],
  resolveType: () => {
    return PartnerType
  },
})

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

export const OrderType = new GraphQLObjectType<OrderJSON, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    availableShippingCountries: {
      description:
        "List of alpha-2 country codes to which the order can be shipped",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ available_shipping_countries }) =>
        available_shipping_countries,
    },
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Phone number of the buyer",
      deprecationReason: "Use `order.fulfillmentDetails.phoneNumber`",
      resolve: ({ buyer_phone_number }) => buyer_phone_number,
    },
    buyerTotal: {
      type: Money,
      description: "The total amount the buyer is expected to pay",
      resolve: (
        { buyer_total_cents: minor, currency_code: currencyCode },
        _args,
        ctx,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          ctx,
          _info
        )
      },
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order code",
      resolve: ({ code }) => code,
    },
    displayTexts: {
      type: new GraphQLNonNull(DisplayTextsType),
      description:
        "Display texts for the order based on its buyer_state and order shipping/payment states",
      resolve: (order) => resolveDisplayTexts(order),
    },
    fulfillmentDetails: {
      type: FulfillmentDetailsType,
      description: "Buyer fulfillment details for order",
      resolve: (order) => ({
        addressLine1: order.shipping_address_line1,
        addressLine2: order.shipping_address_line2,
        city: order.shipping_city,
        country: order.shipping_country,
        name: order.shipping_name,
        phoneNumber: order.buyer_phone_number,
        phoneNumberCountryCode: order.buyer_phone_number_country_code,
        postalCode: order.shipping_postal_code,
        region: order.shipping_region,
      }),
    },
    fulfillmentOptions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(FulfillmentOptionType))
      ),
      resolve: ({
        fulfillment_options,
        currency_code,
      }): Array<FulfillmentOptionJSONWithCurrencyCode> =>
        fulfillment_options.map((option) => ({
          ...option,
          _currencyCode: currency_code,
        })),
    },
    itemsTotal: {
      type: Money,
      description: "The total amount of the line items",
      resolve: (
        { items_total_cents: minor, currency_code: currencyCode },
        _args,
        ctx,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          ctx,
          _info
        )
      },
    },
    lineItems: {
      type: new GraphQLNonNull(new GraphQLList(LineItemType)),
      resolve: ({ line_items }) => line_items,
    },
    mode: {
      type: new GraphQLNonNull(OrderModeEnum),
      resolve: (order) => resolveMode(order),
    },
    pricingBreakdownLines: PricingBreakdownLines,
    selectedFulfillmentOption: {
      type: FulfillmentOptionType,
      description: "The selected fulfillment option for the order",
      resolve: (order) => {
        const selectedOption = order.fulfillment_options.find(
          (option) => option.selected
        )
        if (!selectedOption) {
          return null
        }
        return {
          ...selectedOption,
          _currencyCode: order.currency_code,
        }
      },
    },
    seller: {
      type: SellerType,
      description: "The seller of the order",
      resolve: ({ seller_id }, _args, { partnerLoader }) => {
        if (!seller_id) return null

        return partnerLoader(seller_id).catch(() => null)
      },
    },
    shippingTotal: {
      type: Money,
      description: "The total amount for shipping",
      resolve: (
        { shipping_total_cents: minor, currency_code: currencyCode },
        _args,
        ctx,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          ctx,
          _info
        )
      },
    },
    source: {
      type: new GraphQLNonNull(OrderSourceEnum),
      description: "Source of the order",
      resolve: (order) => resolveSource(order),
    },
    taxTotal: {
      type: Money,
      description: "The total amount for tax",
      resolve: (
        { tax_total_cents: minor, currency_code: currencyCode },
        _args,
        ctx,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          ctx,
          _info
        )
      },
    },
  },
})

const ExchangeErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "ExchangeError",
  fields: {
    message: { type: new GraphQLNonNull(GraphQLString) },
    code: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderMutationError",
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(ExchangeErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderMutationSuccess",
  fields: () => ({
    order: {
      type: new GraphQLNonNull(OrderType),
      resolve: (response) => {
        return response
      },
    },
  }),
})

export const ORDER_MUTATION_FLAGS = {
  SUCCESS: "SuccessType",
  ERROR: "ErrorType",
} as const

export const OrderMutationResponseType = new GraphQLUnionType({
  name: "SetOrderFulfillmentOptionResponse",
  types: [SuccessType, ErrorType],
  resolveType: (data) => {
    const result =
      data._type === ORDER_MUTATION_FLAGS.ERROR ? ErrorType : SuccessType
    return result
  },
})

const resolveSource = ({ source }) => {
  switch (source) {
    case "artwork_page":
      return "ARTWORK_PAGE"
    case "inquiry":
      return "INQUIRY"
    case "private_sale":
      return "PRIVATE_SALE"
    case "partner_offer":
      return "PARTNER_OFFER"
    default:
      throw new Error(`Unknown order source: ${source}`)
  }
}

const resolveMode = ({ mode }) => {
  switch (mode) {
    case "buy":
      return "BUY"
    case "offer":
      return "OFFER"
    default:
      throw new Error(`Unknown order mode: ${mode}`)
  }
}
