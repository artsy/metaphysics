import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../../fields/money"
import { OrderType } from "./OrderType"
import { OrderJSON } from "./exchangeJson"

export const OrderModeEnum = new GraphQLEnumType({
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

export const OrderSourceEnum = new GraphQLEnumType({
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

export const OrderStripePaymentMethodTypeEnum = new GraphQLEnumType({
  name: "OrderStripePaymentMethodTypeEnum",
  values: {
    card: {
      value: "card",
    },
    us_bank_account: {
      value: "us_bank_account",
    },
    sepa_debit: {
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

export const OrderBuyerStateEnum = new GraphQLEnumType({
  name: "OrderBuyerStateEnum",
  values: {
    INCOMPLETE: {
      value: "INCOMPLETE",
      description: "Order is incomplete (pending or abandoned)",
    },
    SUBMITTED: { value: "SUBMITTED", description: "Order has been submitted" },
    OFFER_RECEIVED: {
      value: "OFFER_RECEIVED",
      description: "Order is an offer awaiting response from the buyer",
    },
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
    CANCELED: { value: "CANCELED", description: "Order has been canceled" },
    UNKNOWN: { value: "UNKNOWN", description: "Order status is unknown" },
  },
})

export const OrderSellerStateEnum = new GraphQLEnumType({
  name: "OrderSellerStateEnum",
  values: {
    INCOMPLETE: {
      value: "INCOMPLETE",
      description: "Order is incomplete (not actionable by seller)",
    },
    ORDER_RECEIVED: {
      value: "ORDER_RECEIVED",
      description: "Order has been received",
    },
    OFFER_RECEIVED: {
      value: "OFFER_RECEIVED",
      description: "Offer has been received from buyer",
    },
    OFFER_SENT: {
      value: "OFFER_SENT",
      description: "Offer has been sent to buyer",
    },
    PAYMENT_FAILED: {
      value: "PAYMENT_FAILED",
      description: "Payment has failed",
    },
    PROCESSING_PAYMENT: {
      value: "PROCESSING_PAYMENT",
      description: "Processing payment",
    },
    APPROVED_PICKUP: {
      value: "APPROVED_PICKUP",
      description: "Approved - action is to coordinate pickup",
    },
    APPROVED_SELLER_SHIP: {
      value: "APPROVED_SELLER_SHIP",
      description: "Approved - action is for seller to pack and ship",
    },
    APPROVED_ARTSY_SELF_SHIP: {
      value: "APPROVED_ARTSY_SELF_SHIP",
      description:
        "Approved - action is for seller to print Artsy label, pack and ship",
    },
    APPROVED_ARTSY_SHIP: {
      value: "APPROVED_ARTSY_SHIP",
      description: "Approved - action is for seller to wait for Artsy pickup",
    },
    IN_TRANSIT: {
      value: "IN_TRANSIT",
      description: "Order is in transit",
    },
    COMPLETED: {
      value: "COMPLETED",
      description: "Order is completed",
    },
    REFUNDED: {
      value: "REFUNDED",
      description: "Order has been refunded",
    },
    CANCELED: {
      value: "CANCELED",
      description: "Order has been canceled",
    },
    UNKNOWN: {
      value: "UNKNOWN",
      description: "Order status is unknown",
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
    ARTSY_STANDARD: { value: "ARTSY_STANDARD" },
    ARTSY_EXPRESS: { value: "ARTSY_EXPRESS" },
    ARTSY_WHITE_GLOVE: { value: "ARTSY_WHITE_GLOVE" },
  },
})

export type FulfillmentOptionJSONWithCurrencyCode = OrderJSON["fulfillment_options"][number] & {
  _currencyCode: string
}

export const FulfillmentOptionType = new GraphQLObjectType<
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
