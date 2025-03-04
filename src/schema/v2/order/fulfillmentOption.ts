import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInterfaceType,
} from "graphql"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"

// Enum for type field
const FulfillmentOptionTypeEnum = new GraphQLEnumType({
  name: "FulfillmentOptionTypeEnum",
  values: {
    DOMESTIC_FLAT: { value: "DOMESTIC_FLAT" },
    INTERNATIONAL_FLAT: { value: "INTERNATIONAL_FLAT" },
    PICKUP: { value: "PICKUP" },
    SHIPPING_TBD: { value: "SHIPPING_TBD" },
  },
})

const commonFields = {
  amount: {
    type: Money,
    resolve: (
      // TODO: Add currency code to fulfillment option json
      { amount_minor: minor, currencyCode = "USD" },
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
}

// Specific fulfillment options
const FulfillmentOptionInterface = new GraphQLInterfaceType({
  name: "FulfillmentOptionInterface",
  fields: {
    type: { type: FulfillmentOptionTypeEnum },
    ...commonFields,
  },
  resolveType(value) {
    switch (value.type) {
      case "domestic_flat":
        return DomesticFlatType
      case "international_flat":
        return InternationalFlatType
      case "pickup":
        return PickupType
      case "shipping_tbd":
        return ShippingTBDType
      default:
        return null
    }
  },
})

const DomesticFlatType = new GraphQLObjectType({
  name: "DomesticFlatFulfillmentOption",
  interfaces: [FulfillmentOptionInterface],
  fields: {
    type: { type: FulfillmentOptionTypeEnum, resolve: () => "DOMESTIC_FLAT" },
    ...commonFields,
  },
})

const InternationalFlatType = new GraphQLObjectType({
  name: "InternationalFlatFulfillmentOption",
  interfaces: [FulfillmentOptionInterface],
  fields: {
    type: {
      type: FulfillmentOptionTypeEnum,
      resolve: () => "INTERNATIONAL_FLAT",
    },
    ...commonFields,
  },
})

const PickupType = new GraphQLObjectType({
  name: "PickupFulfillmentOption",
  interfaces: [FulfillmentOptionInterface],
  fields: {
    type: { type: FulfillmentOptionTypeEnum, resolve: () => "PICKUP" },
    ...commonFields,
  },
})

const ShippingTBDType = new GraphQLObjectType({
  name: "ShippingTBDFulfillmentOption",
  interfaces: [FulfillmentOptionInterface],
  fields: {
    type: { type: FulfillmentOptionTypeEnum, resolve: () => "SHIPPING_TBD" },
    ...commonFields,
  },
})

// Union type to combine all fulfillment options
export const FulfillmentOptionUnionType = new GraphQLUnionType({
  name: "FulfillmentOptionUnion",
  types: [DomesticFlatType, InternationalFlatType, PickupType, ShippingTBDType],
  resolveType(value) {
    switch (value.type) {
      case "domestic_flat":
        return DomesticFlatType
      case "international_flat":
        return InternationalFlatType
      case "pickup":
        return PickupType
      case "shipping_tbd":
        return ShippingTBDType
      default:
        return null
    }
  },
})
