import { GraphQLInterfaceType, GraphQLString } from "graphql"

export const Searchable = new GraphQLInterfaceType({
  name: "Searchable",
  description: "An object that may be searched for",
  fields: {
    displayLabel: {
      type: GraphQLString,
    },
    imageUrl: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
    },
  },
})
