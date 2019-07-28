import { GraphQLBoolean, GraphQLInterfaceType, GraphQLString } from "graphql"
import { deprecate } from "lib/deprecation"

import Dimensions from "./dimensions"

export const Sellable = new GraphQLInterfaceType({
  name: "Sellable",
  description: "A piece that can be sold",
  fields: {
    dimensions: Dimensions,
    edition_of: {
      type: GraphQLString,
    },
    is_acquireable: {
      type: GraphQLBoolean,
      description: "Whether a piece can be purchased through e-commerce",
    },
    is_offerable: {
      type: GraphQLBoolean,
      description: "Whether a user can make an offer on the work",
    },
    is_for_sale: {
      type: GraphQLBoolean,
    },
    is_sold: {
      type: GraphQLBoolean,
    },
    sale_message: {
      type: GraphQLString,
    },
  },
})
