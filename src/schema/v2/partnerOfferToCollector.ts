import { date } from "./fields/date"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields, NodeInterface } from "./object_identification"
import { connectionWithCursorInfo } from "./fields/pagination"
import { Money, resolveMinorAndCurrencyFieldsToMoney } from "./fields/money"

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
    isAvailable: {
      type: GraphQLBoolean,
      resolve: ({ available }) => available,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
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
