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
