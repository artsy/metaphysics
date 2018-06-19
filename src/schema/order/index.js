import {
  GraphQLID,
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
import User from "schema/user"

export const OrderLineItemType = new GraphQLObjectType({
  name: "OrderLineItem",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order line item",
    },
    artwork: {
      type: Artwork.type,
      description: "Artwork that is being ordered",
    },
    edition_set: {
      type: EditionSet.type,
      description: "Edition set on the artwork",
      resolve: ({ edition_set_id }) => edition_set_id,
    },
    partner: {
      type: Partner.type,
      description: "Partner being ordered from",
      resolve: ({ partner }) => partner,
    },
    price_cents: {
      type: GraphQLInt,
      description: "Price of this line item in cents",
    },
  }),
})

export const OrderType = new GraphQLObjectType({
  name: "Order",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order",
    },
    line_items: {
      type: new GraphQLList(OrderLineItemType),
      description: "List of order line items",
    },
    partner: {
      type: Partner.type,
      description: "Partner of this order",
    },
    user: {
      type: User.type,
      description: "User of this order",
    },
    currency_code: {
      type: GraphQLString,
      description: "Currency code of this order",
    },
  }),
})
