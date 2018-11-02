import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"
import date from "schema/fields/date"
import { OrderPartyUnionType } from "./order_party_union"
import { OrderType } from "./order"
export const OfferType = new GraphQLObjectType({
  name: "Offer",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the offer",
    },
    createdAt: date,
    creatorId: {
      type: GraphQLString,
      description: "Id of the user who created the order",
    },
    from: {
      type: OrderPartyUnionType,
      description: "The type of the party who made the offer",
    },
    amountCents: {
      type: GraphQLInt,
      description: "Offer amount in cents",
    },
    order: {
      type: OrderType,
      description: "The order on which the offer was made",
    },
    respondsTo: {
      type: OfferType,
      description: "The order on which the offer was made",
    },
  }),
})
export const {
  connectionType: OfferConnection,
  edgeType: OfferEdge,
} = connectionDefinitions({
  nodeType: OfferType,
})
