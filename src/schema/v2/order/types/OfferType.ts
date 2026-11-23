import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../../object_identification"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "../../fields/money"
import { date } from "../../fields/date"
import { OrderType } from "./OrderType"
import {
  PricingBreakdownLinesType,
  resolveOfferPricingBreakdownLines,
} from "./PricingBreakdownLines"

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
  defines_total?: boolean
  offer_amount_changed?: boolean
  responds_to_id?: string | null
  _selectedFulfillmentOptionType?: string
  // Sibling submitted offers from the parent order, stashed by the order's
  // offer resolvers so `respondsTo` can resolve without extra loader calls.
  _submittedOffers?: OfferJSON[]
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
          { minor, currencyCode, format: "0,0.00", exact: true },
          _args,
          context,
          _info
        )
      },
    },
    createdAt: date(({ created_at }) => created_at),
    definesTotal: {
      type: GraphQLBoolean,
      description:
        "Whether this offer defines the total (amount, shipping and tax) for the first time in the negotiation",
      resolve: ({ defines_total }) => defines_total ?? null,
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
    offerAmountChanged: {
      type: GraphQLBoolean,
      description:
        "Whether this offer's amount differs from the offer it responds to",
      resolve: ({ offer_amount_changed }) => offer_amount_changed ?? null,
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
          { minor, currencyCode, format: "0,0.00", exact: true },
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
          { minor, currencyCode, format: "0,0.00", exact: true },
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
          { minor, currencyCode, format: "0,0.00", exact: true },
          _args,
          context,
          _info
        )
      },
    },
    order: {
      type: OrderType,
      description: "The order this offer belongs to",
      resolve: ({ order_id }, _args, { meOrderLoader }) => {
        if (!order_id || !meOrderLoader) {
          return null
        }
        return meOrderLoader(order_id)
      },
    },
    pricingBreakdownLines: {
      type: PricingBreakdownLinesType,
      description: "Pricing breakdown lines",
      resolve: resolveOfferPricingBreakdownLines,
    },
    respondsTo: {
      type: OfferType,
      description:
        "The offer this offer responds to (i.e. the offer being countered), if any",
      resolve: async (offer, _args, { meOrderLoader }) => {
        const { responds_to_id, order_id } = offer
        if (!responds_to_id) return null

        // Offers resolved through an order carry their sibling submitted
        // offers. Only offers resolved standalone (e.g. offer mutation
        // payloads) fall back to fetching the order.
        let submittedOffers = offer._submittedOffers
        if (!submittedOffers) {
          if (!order_id || !meOrderLoader) return null
          const order = await meOrderLoader(order_id)
          submittedOffers = order?.submitted_offers ?? []
        }

        const respondsTo = submittedOffers?.find(
          ({ id }) => id === responds_to_id
        )
        if (!respondsTo) return null

        return {
          ...respondsTo,
          _selectedFulfillmentOptionType: offer._selectedFulfillmentOptionType,
          _submittedOffers: submittedOffers,
        }
      },
    },
  }),
})
