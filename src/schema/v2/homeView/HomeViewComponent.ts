import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "A display title for this section",
    },
    href: {
      type: GraphQLString,
      description: "A URL to navigate to when clicked",
    },
  },
})
