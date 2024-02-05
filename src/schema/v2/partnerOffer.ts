import { date } from "./fields/date"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { IDFields } from "./object_identification"

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
      type: GraphQLFloat,
      resolve: ({ price_listed }) => price_listed,
    },
    priceWithDiscount: {
      type: GraphQLFloat,
      resolve: ({ price_with_discount }) => price_with_discount,
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
