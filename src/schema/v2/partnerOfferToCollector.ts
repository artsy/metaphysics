import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "./fields/date"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "./fields/money"
import { connectionWithCursorInfo } from "./fields/pagination"
import { IDFields, NodeInterface } from "./object_identification"
import { PartnerOfferSourceEnumType } from "./partnerOffer"

export const PartnerOfferToCollectorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerOfferToCollector",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    createdAt: date(),
    endAt: date(),
    isActive: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    isAvailable: {
      type: GraphQLBoolean,
      resolve: ({ available }) => available,
    },
    note: {
      type: GraphQLString,
    },
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
        return resolveMinorAndCurrencyFieldsToMoney(
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
    priceWithDiscount: {
      type: Money,
      resolve: (
        { price_with_discount_minor: minor, price_currency: currencyCode },
        args,
        context,
        info
      ) => {
        return resolveMinorAndCurrencyFieldsToMoney(
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
    source: {
      type: PartnerOfferSourceEnumType,
    },
  }),
})

export const PartnerOfferToCollectorConnectionType = connectionWithCursorInfo({
  nodeType: PartnerOfferToCollectorType,
}).connectionType

export const PartnerOfferToCollectorSortsType = new GraphQLEnumType({
  name: "PartnerOfferToCollectorSorts",
  values: {
    CREATED_AT_ASC: {
      value: "created_at",
    },
    CREATED_AT_DESC: {
      value: "-created_at",
    },
    END_AT_ASC: {
      value: "end_at",
    },
    END_AT_DESC: {
      value: "-end_at",
    },
  },
})
