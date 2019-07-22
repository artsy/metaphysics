import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql"

export const OfferMutationInputType = new GraphQLInputObjectType({
  name: "OfferMutationInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Offer ID",
    },
  },
})
