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
import { Money } from "./fields/money"
import currencyCodes from "lib/currency_codes.json"

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
    priceListed: {
      type: Money,
      resolve: ({ price_listed: price, price_currency: currency }) => {
        const factor =
          currencyCodes[currency?.toLowerCase()]?.subunit_to_unit ?? 100
        const cents = price * factor
        return { cents, currency }
      },
    },
    priceWithDiscount: {
      type: Money,
      resolve: ({ price_with_discount: price, price_currency: currency }) => {
        const factor =
          currencyCodes[currency?.toLowerCase()]?.subunit_to_unit ?? 100
        const cents = price * factor
        return { cents, currency }
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
