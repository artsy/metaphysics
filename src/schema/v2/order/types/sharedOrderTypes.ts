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
import { DisplayTexts } from "./DisplayTexts"
import { PartnerType } from "schema/v2/partner/partner"
import { PhoneNumberType, resolvePhoneNumber } from "../../phoneNumber"
import { PricingBreakdownLines } from "./PricingBreakdownLines"
import { OrderJSON } from "./exchangeJson"
import { PaymentMethodUnion } from "schema/v2/payment_method_union"
import { DeliveryInfo } from "./DeliveryInfo"
import { ArtworkOrEditionSetType } from "schema/v2/artworkOrEditionSet"

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
    WIRE_TRANSFER: {
      value: "wire_transfer",
    },
    US_BANK_ACCOUNT: {
      value: "us_bank_account",
    },
    SEPA_DEBIT: {
      value: "sepa_debit",
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

const OrderBuyerStateEnum = new GraphQLEnumType({
  name: "OrderBuyerStateEnum",
  values: {
    INCOMPLETE: {
      value: "INCOMPLETE",
      description: "Order is incomplete (pending or abandoned)",
    },
    SUBMITTED: { value: "SUBMITTED", description: "Order has been submitted" },
    PAYMENT_FAILED: {
      value: "PAYMENT_FAILED",
      description: "Payment has failed",
    },
    PROCESSING_PAYMENT: {
      value: "PROCESSING_PAYMENT",
      description: "Processing payment",
    },
    PROCESSING_OFFLINE_PAYMENT: {
      value: "PROCESSING_OFFLINE_PAYMENT",
      description: "Processing offline payment",
    },
    APPROVED: { value: "APPROVED", description: "Order has been approved" },
    SHIPPED: { value: "SHIPPED", description: "Order has been shipped" },
    COMPLETED: { value: "COMPLETED", description: "Order is completed" },
    REFUNDED: { value: "REFUNDED", description: "Order has been refunded" },
    DECLINED_BY_SELLER: {
      value: "DECLINED_BY_SELLER",
      description: "Order was declined by the seller",
    },
    DECLINED_BY_BUYER: {
      value: "DECLINED_BY_BUYER",
      description: "Order was declined by the buyer",
    },
    CANCELLED: { value: "CANCELLED", description: "Order has been cancelled" },
    UNKNOWN: { value: "UNKNOWN", description: "Order status is unknown" },
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
    ARTSY_STANDARD: { value: "ARTSY_STANDARD" },
    ARTSY_EXPRESS: { value: "ARTSY_EXPRESS" },
    ARTSY_WHITE_GLOVE: { value: "ARTSY_WHITE_GLOVE" },
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
        if (type === "artsy_standard") return "ARTSY_STANDARD"
        if (type === "artsy_express") return "ARTSY_EXPRESS"
        if (type === "artsy_white_glove") return "ARTSY_WHITE_GLOVE"
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
    artworkOrEditionSet: {
      type: ArtworkOrEditionSetType,
      resolve: async (
        { artwork_id, edition_set_id },
        _args,
        { artworkLoader }
      ) => {
        if (artwork_id && edition_set_id) {
          const artwork = await artworkLoader(artwork_id)
          if (artwork && artwork.edition_sets) {
            const editionSet = artwork.edition_sets.find(
              (es) => es.id === edition_set_id
            )
            if (editionSet) {
              return { ...editionSet, __typename: "EditionSet" }
            }
          }
        } else if (artwork_id) {
          const artwork = await artworkLoader(artwork_id)
          if (artwork) {
            return { ...artwork, __typename: "Artwork" }
          }
        }
        return null
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

export const OrderType = new GraphQLObjectType<OrderJSON, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    availablePaymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(OrderPaymentMethodEnum))
      ),
      description: "List of available payment methods for the order",
      resolve: ({ available_payment_methods }) => available_payment_methods,
    },
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
    buyerState: {
      type: OrderBuyerStateEnum,
      description:
        "Calculated state of the order that defines buyer facing state/actions",
      resolve: (order) => resolveBuyerState(order),
    },
    buyerStateExpiresAt: {
      type: GraphQLString,
      description: "Expiration for the current state of the order",
      resolve: ({ buyer_state_expires_at }) => buyer_state_expires_at,
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order code",
      resolve: ({ code }) => code,
    },
    createdAt: {
      type: GraphQLString,
      description: "Order creation time",
      resolve: ({ created_at }) => created_at,
    },
    creditCardWalletType: {
      type: OrderCreditCardWalletTypeEnum,
      description: "Express Checkout wallet type",
      resolve: ({ credit_card_wallet_type }) => credit_card_wallet_type,
    },
    stripeConfirmationToken: {
      type: GraphQLString,
      description: "Stripe confirmation token for the order",
      resolve: ({ stripe_confirmation_token }) => stripe_confirmation_token,
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Currency code",
      resolve: ({ currency_code }) => currency_code,
    },
    deliveryInfo: DeliveryInfo,
    displayTexts: DisplayTexts,
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
    impulseConversationId: {
      type: GraphQLString,
      description: "Impulse conversation Id for the order",
      resolve: ({ impulse_conversation_id }) => impulse_conversation_id,
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
    paymentMethod: {
      type: OrderPaymentMethodEnum,
      description: "Payment method used for the order",
      resolve: ({ payment_method }) => payment_method,
    },
    paymentMethodDetails: {
      type: PaymentMethodUnion,
      description: "The payment method details that was used for the order",
      resolve: (order, _args, ctx) => resolvePaymentMethodDetails(order, ctx),
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
    shippingOrigin: {
      type: GraphQLString,
      description: "Display short version of order's artwork location",
      resolve: ({ shipping_origin }) => shipping_origin,
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
    totalListPrice: {
      type: Money,
      description:
        "The total list price of items (accounting for limited partner offer if applicable)",
      resolve: (
        { total_list_price_cents: minor, currency_code: currencyCode },
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

const OrderActionDataType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderActionData",
  fields: {
    clientSecret: { type: new GraphQLNonNull(GraphQLString) },
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

const ActionRequiredType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderMutationActionRequired",
  fields: () => ({
    actionData: {
      type: new GraphQLNonNull(OrderActionDataType),
      resolve: (response) => response,
    },
  }),
})

export const ORDER_MUTATION_FLAGS = {
  SUCCESS: "ExchangeSuccessType",
  ERROR: "ExchangeErrorType",
  ACTION_REQUIRED: "ExchangeActionRequiredType",
} as const

export const OrderMutationResponseType = new GraphQLUnionType({
  name: "OrderMutationResponse",
  types: [SuccessType, ErrorType, ActionRequiredType],
  resolveType: (data) => {
    switch (data._type) {
      case ORDER_MUTATION_FLAGS.ACTION_REQUIRED:
        return ActionRequiredType
      case ORDER_MUTATION_FLAGS.ERROR:
        return ErrorType
      case ORDER_MUTATION_FLAGS.SUCCESS:
      default:
        return SuccessType
    }
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

const resolvePaymentMethodDetails = (order, context) => {
  const { payment_method, credit_card_id, bank_account_id } = order

  if (!payment_method) {
    return null
  }

  const { creditCardLoader, bankAccountLoader } = context

  switch (payment_method) {
    case "credit card":
      if (!credit_card_id) {
        return null
      }

      return creditCardLoader ? creditCardLoader(credit_card_id) : null
    case "us_bank_account":
    case "sepa_debit":
      if (!bank_account_id) {
        return null
      }
      return bankAccountLoader ? bankAccountLoader(bank_account_id) : null

    case "wire_transfer":
      return { __typename: "WireTransfer", isManualPayment: true }

    default:
      throw new Error(`Unknown order payment method: ${payment_method}`)
  }
}

const resolveBuyerState = (order) => {
  const { buyer_state } = order

  if (!buyer_state) {
    return null
  }

  switch (buyer_state) {
    case "incomplete":
      return "INCOMPLETE"
    case "submitted":
      return "SUBMITTED"
    case "payment_failed":
      return "PAYMENT_FAILED"
    case "processing_payment":
      return "PROCESSING_PAYMENT"
    case "processing_offline_payment":
      return "PROCESSING_OFFLINE_PAYMENT"
    case "approved":
      return "APPROVED"
    case "shipped":
      return "SHIPPED"
    case "completed":
      return "COMPLETED"
    case "refunded":
      return "REFUNDED"
    case "declined_by_seller":
      return "DECLINED_BY_SELLER"
    case "declined_by_buyer":
      return "DECLINED_BY_BUYER"
    case "cancelled":
      return "CANCELLED"
    default:
      return "UNKNOWN"
  }
}
