import { date } from "./fields/date"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"
import { priceDisplayText } from "lib/moneyHelpers"

export const PartnerOfferType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerOffer",
  fields: () => ({
    ...IDFields,
    artworkId: {
      type: GraphQLString,
      resolve: ({ artwork_id }) => artwork_id,
    },
    available: {
      type: GraphQLBoolean,
    },
    createdAt: date(),
    endAt: date(),
    id: {
      type: GraphQLString,
    },
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
    userIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ user_ids }) => user_ids,
    },
  }),
})
