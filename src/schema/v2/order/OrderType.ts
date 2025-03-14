import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { LineItemType } from "./lineItem"
import { FulfillmentOptionType } from "./fulfillmentOption"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../fields/money"
import { PhoneNumber } from "../phoneNumber"

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

export interface OrderJSON {
  id: string
  code: string
  source: "artwork_page" | "inquiry" | "private_sale" | "partner_offer"
  mode: "buy" | "offer"
  currency_code: string
  available_shipping_countries: string[]
  buyer_phone_number?: string
  buyer_phone_number_country_code?: string
  buyer_total_cents?: number
  shipping_total_cents?: number
  items_total_cents?: number
  shipping_name?: string
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_region?: string
  shipping_country?: string
  fulfillment_options: Array<{
    type: string
    amount_minor: number
    selected?: boolean
  }>
  line_items: Array<{
    id: string
    artwork_id: string
    artwork_version_id: string
    edition_set_id?: string
    list_price_cents: number
    quantity: number
    shipping_total_cents?: number
    currency_code: string
  }>
}

const FulfillmentDetailsType = new GraphQLObjectType<any, ResolverContext>({
  name: "FulfillmentDetails",
  description: "Buyer fulfillment details for order",
  fields: {
    phoneNumber: {
      type: GraphQLString,
      description: "Phone number of the buyer",
    },
    phoneNumberCountryCode: {
      type: GraphQLString,
      description: "Country code of the buyer's phone number",
    },
    name: {
      type: GraphQLString,
      description: "Shipping address name",
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

export const OrderType = new GraphQLObjectType<OrderJSON, ResolverContext>({
  name: "Order",
  description: "Buyer's representation of an order",
  fields: {
    ...InternalIDFields,
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Order code",
      resolve: ({ code }) => code,
    },
    source: {
      type: new GraphQLNonNull(OrderSourceEnum),
      description: "Source of the order",
      resolve: (order) => resolveSource(order),
    },
    mode: {
      type: new GraphQLNonNull(OrderModeEnum),
      resolve: (order) => resolveMode(order),
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
    fulfillmentOptions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(FulfillmentOptionType))
      ),
      resolve: ({ fulfillment_options, currency_code }) =>
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
    // fulfillmentDetails: {
    //   type: FulfillmentDetailsType,
    //   description: "Buyer fulfillment details for order",
    //   resolve: (order) => ({
    //     phoneNumber: order.buyer_phone_number,
    //     phoneNumberCountryCode: order.buyer_phone_number_country_code,
    //     name: order.shipping_name,
    //     addressLine1: order.shipping_address_line1,
    //     addressLine2: order.shipping_address_line2,
    //     city: order.shipping_city,
    //     postalCode: order.shipping_postal_code,
    //     region: order.shipping_region,
    //     country: order.shipping_country,
    //   }),
    // },
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
