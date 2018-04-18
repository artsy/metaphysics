import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import Artwork from "schema/artwork"
import EditionSet from "schema/edition_set"
import Location from "schema/location"
import Partner from "schema/partner"
import money from "schema/fields/money"
import { GravityIDFields } from "schema/object_identification"

export const OrderLineItemType = new GraphQLObjectType({
  name: "OrderLineItem",
  fields: () => ({
    ...GravityIDFields,
    quantity: {
      type: GraphQLInt,
      description: "Quantity of this item",
    },
    artwork: {
      type: Artwork.type,
      description: "Artwork that is being ordered",
      resolve: ({ artwork }) => artwork,
    },
    edition_set: {
      type: EditionSet.type,
      description: "Edition set on the artwork",
      resolve: ({ edition_set }) => edition_set,
    },
    price: money({
      name: "LineItemPrice",
      resolve: ({ price, price_cents }) => ({
        cents: price_cents,
        display: price,
      }),
    }),
    subtotal: money({
      name: "LineItemSubtotal",
      resolve: ({ subtotal, subtotal_cents }) => ({
        cents: subtotal_cents,
        display: subtotal,
      }),
    }),
    tax_cents: {
      type: GraphQLInt,
      description: "Tax on the item",
    },
    partner: {
      type: Partner.type,
      description: "Partner being ordered from",
      resolve: ({ partner }) => partner,
    },
    partner_location: {
      type: Location.type,
      description: "Location of the partner",
      resolve: ({ partner_location }) => partner_location,
    },
    shipping_note: {
      type: GraphQLString,
      description: "Shipping note from the partner",
    },
    sale_conditions_url: {
      type: GraphQLString,
      description: "Sale conditions (set by partner)",
    },
  }),
})

export const OrderStatesType = new GraphQLEnumType({
  name: "OrderStates",
  values: {
    PENDING: {
      value: "pending",
    },
    ABANDONED: {
      value: "abandoned",
    },
    SUBMITTED: {
      value: "submitted",
    },
    APPROVED: {
      value: "approved",
    },
    REJECTED: {
      value: "rejected",
    },
  },
})

export const AddressType = new GraphQLObjectType({
  name: "Address",
  fields: () => ({
    ...GravityIDFields,
    name: {
      type: GraphQLString,
      description: "Name associated with the address",
    },
    street: {
      type: GraphQLString,
      description: "Street associated with the address",
    },
    city: {
      type: GraphQLString,
      description: "City associated with the address",
    },
    region: {
      type: GraphQLString,
      description: "Region associated with the address",
    },
    postal_code: {
      type: GraphQLString,
      description: "Postal code associated with the address",
    },
    country: {
      type: GraphQLString,
      description:
        "Country code associated with the address (standard 3-letter code)",
    },
    usps_address1: {
      type: GraphQLString,
      description: "Address line 1 (verified by USPS)",
    },
    usps_city: {
      type: GraphQLString,
      description: "Address city (verified by USPS)",
    },
    usps_state: {
      type: GraphQLString,
      description: "Address state (verified by USPS)",
    },
    usps_zip: {
      type: GraphQLString,
      description: "Address zip code (verified by USPS)",
    },
  }),
})

export const OrderType = new GraphQLObjectType({
  name: "Order",
  fields: () => ({
    ...GravityIDFields,
    code: {
      type: GraphQLString,
      description: "Order code",
    },
    state: {
      type: OrderStatesType,
      description: "Current state of order",
    },
    notes: {
      type: GraphQLString,
      description: "Notes on the order",
    },
    line_items: {
      type: new GraphQLList(OrderLineItemType),
      description: "List of order line items",
    },
    item_total: money({
      name: "OrderItemTotal",
      resolve: ({ item_total, item_total_cents }) => ({
        cents: item_total_cents,
        display: item_total,
      }),
    }),
    tax_total: money({
      name: "OrderItemTaxTotal",
      resolve: ({ tax_total, tax_total_cents }) => ({
        cents: tax_total_cents,
        display: tax_total,
      }),
    }),
    total: money({
      name: "OrderTotal",
      resolve: ({ total, total_cents }) => ({
        cents: total_cents,
        display: total,
      }),
    }),
    email: {
      type: GraphQLString,
      description: "Email associated with the order",
    },
    telephone: {
      type: GraphQLString,
      description: "Phone number associated with the order",
    },
    token: {
      type: GraphQLString,
      description: "Unique token on the order",
    },
    shipping_address: {
      type: AddressType,
      description: "Shipping address associated with the order",
    },
  }),
})
