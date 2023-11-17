import { date } from "./fields/date"
import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
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
    createdAt: date(),
    currency: {
      type: GraphQLString,
      description: `Currency abbreviation (e.g. "USD")`,
    },
    endAt: date(),
    id: {
      type: GraphQLString,
    },
    partnerId: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    priceMinor: {
      type: GraphQLString,
      resolve: ({ price_minor }) => price_minor,
    },
    userIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ user_ids }) => user_ids,
    },
  }),
})
