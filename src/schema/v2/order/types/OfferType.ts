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
  amount_cents: number
  buyer_total_cents: number | null
  currency_code: string
  from_participant: string
  note: string | null
  shipping_total_cents: number | null
  tax_total_cents: number | null
}

export const OfferType = new GraphQLObjectType<OfferJSON, ResolverContext>({
  name: "Offer",
  description: "An offer on an order",
  fields: {
    ...InternalIDFields,
    amount: {
      type: Money,
      description: "The buyer's total amount for this offer",
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
    note: {
      type: GraphQLString,
      description: "Optional note for the offer",
      resolve: ({ note }) => note,
    },
    fromParticipant: {
      type: new GraphQLNonNull(FromParticipantEnum),
      description: "Who the offer is from",
      resolve: ({ from_participant }) => {
        switch (from_participant.toLowerCase()) {
          case "buyer":
            return "BUYER"
          case "seller":
            return "SELLER"
          default:
            throw new Error(`Unknown from_participant: ${from_participant}`)
        }
      },
    },
  },
})
