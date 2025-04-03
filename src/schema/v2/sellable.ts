import { GraphQLBoolean, GraphQLInterfaceType, GraphQLString } from "graphql"

import Dimensions from "./dimensions"

export const Sellable = new GraphQLInterfaceType({
  name: "Sellable",
  description: "A piece that can be sold",
  fields: () => ({
    dimensions: Dimensions,
    editionOf: {
      type: GraphQLString,
      resolve: ({ edition_of }) => edition_of,
    },
    isAcquireable: {
      type: GraphQLBoolean,
      description: "Whether a piece can be purchased through e-commerce",
      resolve: ({ is_acquireable }) => is_acquireable,
    },
    isOfferable: {
      type: GraphQLBoolean,
      description: "Whether a user can make an offer on the work",
      resolve: ({ is_offerable }) => is_offerable,
    },
    isOfferableFromInquiry: {
      type: GraphQLBoolean,
      description:
        "Whether a user can make an offer on the work through inquiry",
      resolve: ({ is_offerable_from_inquiry }) => is_offerable_from_inquiry,
    },
    isForSale: {
      type: GraphQLBoolean,
      resolve: ({ is_for_sale }) => is_for_sale,
    },
    isSold: {
      type: GraphQLBoolean,
      resolve: ({ is_sold }) => is_sold,
    },
    saleMessage: {
      type: GraphQLString,
      resolve: ({ sale_message }) => sale_message,
    },
  }),
})
