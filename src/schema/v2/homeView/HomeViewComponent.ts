import { GraphQLObjectType, GraphQLString } from "graphql"

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    title: {
      type: GraphQLString,
      description: "A display title for this section",
    },
  },
})
