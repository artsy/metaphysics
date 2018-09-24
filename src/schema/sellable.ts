import Dimensions from "./dimensions"
import { GraphQLInterfaceType, GraphQLBoolean, GraphQLString } from "graphql"

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
    is_for_sale: {
      type: GraphQLBoolean,
    },
    is_sold: {
      type: GraphQLBoolean,
    },
    price: {
      type: GraphQLString,
    },
    sale_message: {
      type: GraphQLString,
    },
  },
})
