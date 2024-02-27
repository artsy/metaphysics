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
    priceListedMessage: {
      type: GraphQLString,
      resolve: ({ price_listed: price, price_currency: currency }) => {
        if (!price || !currency) {
          return null
        }

        const priceCents = price * 100
        return priceDisplayText(priceCents, currency, "")
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
    },
    discountPercentage: {
      type: GraphQLInt,
      resolve: ({ discount_percentage }) => discount_percentage,
    },
    note: {
      type: GraphQLString,
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

export const PartnerOfferSortsType = new GraphQLEnumType({
  name: "PartnerOfferSorts",
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
