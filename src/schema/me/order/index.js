import {
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
    },
    edition_set: {
      type: EditionSet.type,
      description: "Edition set on the artwork",
      resolve: ({ edition_set }) => edition_set,
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

export const OrderAddressType = new GraphQLObjectType({
  name: "OrderAddress",
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
  }),
})

export const OrderType = new GraphQLObjectType({
  name: "Order",
  fields: () => ({
    ...GravityIDFields,
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
    state: {
      type: GraphQLString,
      description: "Order State",
    },
    email: {
      type: GraphQLString,
      description: "Email associated with the order",
    },
    telephone: {
      type: GraphQLString,
      description: "Phone number associated with the order",
    },
    shipping_address: {
      type: OrderAddressType,
      description: "Shipping address associated with the order",
    },
  }),
})
