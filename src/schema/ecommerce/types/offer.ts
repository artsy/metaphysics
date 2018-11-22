import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"
import date from "schema/fields/date"
import { OrderPartyUnionType } from "./order_party_union"
import { OrderInterface, resolveOrderParty } from "./order"
import { UserType } from "schema/user"

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
    creator: {
      type: UserType,
      description: "Creator of this order",
      resolve: (
        { creatorId },
        _args,
        _context,
        { rootValue: { userByIDLoader } }
      ) =>
        userByIDLoader(creatorId).catch(err => {
          if (err.statusCode === 404) {
            return false
          }
        }),
    },
    from: {
      type: OrderPartyUnionType,
      description: "The type of the party who made the offer",
      resolve: (
        { from },
        _args,
        _context,
        { rootValue: { userByIDLoader, partnerLoader } }
      ) => resolveOrderParty(from, userByIDLoader, partnerLoader),
    },
    amountCents: {
      type: GraphQLInt,
      description: "Offer amount in cents",
    },
    order: {
      type: OrderInterface,
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
