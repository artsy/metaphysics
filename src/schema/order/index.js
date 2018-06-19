import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"
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
      resolve: (
        { artworkId },
        _args,
        _context,
        { rootValue: { artworkLoader } }
      ) => artworkLoader(artworkId),
    },
    edition_set: {
      type: EditionSet.type,
      description: "Edition set on the artwork",
      resolve: ({ edition_set_id }) => edition_set_id,
    },
    priceCents: {
      type: GraphQLInt,
      description: "Price of this line item in cents",
    },
  }),
})

export const {
  connectionType: OrderLineItemConnection,
  edgeType: OrderLineItemEdge,
} = connectionDefinitions({
  nodeType: OrderLineItemType,
})

export const OrderType = new GraphQLObjectType({
  name: "Order",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order",
    },
    lineItems: {
      type: OrderLineItemConnection,
      description: "List of order line items",
    },
    partner: {
      type: Partner.type,
      description: "Partner of this order",
      resolve: (
        { partnerId },
        _args,
        _context,
        { rootValue: { partnerLoader } }
      ) => partnerLoader(partnerId),
    },
    user: {
      type: User.type,
      description: "User of this order",
      // resolve: ({ userId }, _args, _context, { rootValue: { userLoader } }) =>
      //   userLoader(userId),
    },
    currencyCode: {
      type: GraphQLString,
      description: "Currency code of this order",
    },
    state: {
      type: GraphQLString,
      description: "State of the order",
    },
    code: {
      type: GraphQLString,
      description: "Tracking code of the order",
    },
  }),
})
