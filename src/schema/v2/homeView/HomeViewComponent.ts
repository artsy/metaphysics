import { GraphQLObjectType, GraphQLString } from "graphql"

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    title: {
      type: GraphQLString,
      description: "A display title for this section",
    },
    subtitle: {
      type: GraphQLString,
      description: "A display subtitle for this section",
    },
    backgroundColor: {
      type: GraphQLString,
      description: "A background color for this section",
    },
  },
})
