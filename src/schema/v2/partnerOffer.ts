import { date } from "./fields/date"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "./object_identification"
import { priceDisplayText } from "lib/moneyHelpers"
import { connectionWithCursorInfo } from "./fields/pagination"
import { Money, resolvePriceAndCurrencyFieldsToMoney } from "./fields/money"

export const PartnerOfferSourceEnumType = new GraphQLEnumType({
  name: "PartnerOfferSourceEnum",
  values: {
    SAVE: { value: "Save" },
    ABANDONED_ORDER: { value: "Abandoned Order" },
  },
})

export const PartnerOfferType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerOffer",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    isActive: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    isAvailable: {
      type: GraphQLBoolean,
      resolve: ({ available }) => available,
    },
    createdAt: date(),
    endAt: date(),
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    priceListed: {
      type: Money,
      resolve: (
        { price_listed_minor: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        return resolvePriceAndCurrencyFieldsToMoney(
          {
            minor,
            currencyCode,
          },
          args,
          context,
          info
        )
      },
    },
    priceListedMessage: {
      type: GraphQLString,
      resolve: ({ price_listed: price, price_currency: currency }) => {
        if (!price || !currency) {
          return null
        }

        const priceCents = price * 100
        return priceDisplayText(priceCents, currency, "")
      },
      deprecationReason: "This field is deprecated. Use 'priceListed' instead.",
    },
    priceWithDiscount: {
      type: Money,
      resolve: (
        { price_with_discount_minor: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        return resolvePriceAndCurrencyFieldsToMoney(
          {
            minor,
            currencyCode,
          },
          args,
          context,
          info
        )
      },
    },
    priceWithDiscountMessage: {
      type: GraphQLString,
      resolve: ({ price_with_discount: price, price_currency: currency }) => {
        if (!price || !currency) {
          return null
        }

        const priceCents = price * 100
        return priceDisplayText(priceCents, currency, "")
      },
      deprecationReason:
        "This field is deprecated. Use 'priceWithDiscount' instead.",
    },
    discountPercentage: {
      type: GraphQLInt,
      resolve: ({ discount_percentage }) => discount_percentage,
    },
    note: {
      type: GraphQLString,
    },
    source: {
      type: PartnerOfferSourceEnumType,
    },
    userIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ user_ids }) => user_ids,
    },
  }),
})

export const PartnerOfferConnectionType = connectionWithCursorInfo({
  nodeType: PartnerOfferType,
}).connectionType
