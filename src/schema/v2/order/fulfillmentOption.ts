import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
} from "graphql"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"
import { GraphQLInputObjectType, GraphQLNonNull } from "graphql"

// Enum for type field
export const FulfillmentOptionTypeEnum = new GraphQLEnumType({
  name: "FulfillmentOptionTypeEnum",
  values: {
    DOMESTIC_FLAT: { value: "DOMESTIC_FLAT" },
    INTERNATIONAL_FLAT: { value: "INTERNATIONAL_FLAT" },
    PICKUP: { value: "PICKUP" },
    SHIPPING_TBD: { value: "SHIPPING_TBD" },
  },
})

export const FulfillmentOptionType = new GraphQLObjectType({
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

export const FulfillmentOptionInputType = new GraphQLInputObjectType({
  name: "FulfillmentOptionInput",
  fields: {
    type: { type: new GraphQLNonNull(FulfillmentOptionTypeEnum) },
    amountMinor: { type: new GraphQLNonNull(GraphQLInt) },
  },
})
