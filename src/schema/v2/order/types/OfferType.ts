import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../../object_identification"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../../fields/money"

export const FromParticipantEnum = new GraphQLEnumType({
  name: "FromParticipantEnum",
  values: {
    BUYER: {
      value: "BUYER",
    },
    SELLER: {
      value: "SELLER",
    },
  },
})

export type OfferJSON = {
  id: string
  order_id: string
  amount_cents: number | null
  buyer_total_cents: number | null
  currency_code: string
  from_participant: string
  note: string | null
  shipping_total_cents: number | null
  tax_total_cents: number | null
  created_at: string
}

export const OfferType = new GraphQLObjectType<OfferJSON, ResolverContext>({
  name: "Offer",
  description: "An offer on an order",
  fields: () => ({
    ...InternalIDFields,

    amount: {
      type: Money,
      description: "The amount for this offer",
      resolve: (
        { amount_cents: minor, currency_code: currencyCode },
        _args,
        context,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          context,
          _info
        )
      },
    },
    createdAt: {
      type: GraphQLString,
      description: "Offer creation time",
      resolve: ({ created_at }) => created_at,
    },
    fromParticipant: {
      type: new GraphQLNonNull(FromParticipantEnum),
      description: "Who the offer is from",
      resolve: ({ from_participant }) => {
        switch (from_participant.toUpperCase()) {
          case "BUYER":
            return "BUYER"
          case "SELLER":
            return "SELLER"
          default:
            throw new Error(`Unknown from_participant: ${from_participant}`)
        }
      },
    },
    note: {
      type: GraphQLString,
      description: "Optional note for the offer",
      resolve: ({ note }) => note,
    },
    buyerTotal: {
      type: Money,
      description:
        "The buyer total for this offer, if a complete total is available",
      resolve: (
        { buyer_total_cents: minor, currency_code: currencyCode },
        _args,
        context,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          context,
          _info
        )
      },
    },
    shippingTotal: {
      type: Money,
      description: "The shipping total for this offer",
      resolve: (
        { shipping_total_cents: minor, currency_code: currencyCode },
        _args,
        context,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          context,
          _info
        )
      },
    },
    taxTotal: {
      type: Money,
      description: "The tax total for this offer",
      resolve: (
        { tax_total_cents: minor, currency_code: currencyCode },
        _args,
        context,
        _info
      ) => {
        if (minor == null || currencyCode == null) {
          return null
        }
        return resolveMinorAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          _args,
          context,
          _info
        )
      },
    },
    order: {
      type: require("./OrderType").OrderType,
      description: "The order this offer belongs to",
      resolve: ({ order_id }, _args, { meOrderLoader }) => {
        if (!order_id || !meOrderLoader) {
          return null
        }
        return meOrderLoader(order_id)
      },
    },
  }),
})
