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
import { amount } from "schema/fields/money"
import { OrderParticipantEnum } from "./enums/order_participant_enum"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

export const OfferType = new GraphQLObjectType<any, ResolverContext>({
  name: "Offer",
  fields: () => ({
    ...InternalIDFields,
    createdAt: date,
    creatorId: {
      type: GraphQLString,
      description: "Id of the user who created the order",
    },
    creator: {
      type: UserType,
      description: "Creator of this order",
      resolve: ({ creatorId }, _args, { userByIDLoader }) =>
        userByIDLoader(creatorId).catch(err => {
          if (err.statusCode === 404) {
            return false
          }
        }),
    },
    from: {
      type: OrderPartyUnionType,
      description: "The type of the party who made the offer",
      resolve: ({ from }, _args, { userByIDLoader, partnerLoader }) =>
        resolveOrderParty(from, userByIDLoader, partnerLoader),
    },
    fromParticipant: {
      type: OrderParticipantEnum,
      description: "the order participant who created the offer",
    },
    amountCents: {
      type: GraphQLInt,
      description: "Offer amount in cents",
    },
    amount: amount(({ amountCents }) => amountCents),
    shippingTotalCents: {
      type: GraphQLInt,
      description: "Shipping total based on this offer in cents",
    },
    shippingTotal: amount(({ shippingTotalCents }) => shippingTotalCents),
    taxTotalCents: {
      type: GraphQLInt,
      description: "Tax total based on this offer in cents",
    },
    taxTotal: amount(({ taxTotalCents }) => taxTotalCents),
    order: {
      type: OrderInterface,
      description: "The order on which the offer was made",
    },
    buyerTotalCents: {
      type: GraphQLInt,
      description: "Total of amount, shipping and tax in cents",
    },
    buyerTotal: amount(({ buyerTotalCents }) => buyerTotalCents),
    respondsTo: {
      type: OfferType,
      description: "The order on which the offer was made",
    },
    submittedAt: date,
    note: {
      type: GraphQLString,
      description: "Offer note",
    },
  }),
})

export const {
  connectionType: OfferConnection,
  edgeType: OfferEdge,
} = connectionDefinitions({
  nodeType: OfferType,
})
