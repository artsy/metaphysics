import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "A display title for this section",
    },
    description: {
      type: GraphQLString,
      description: "A description for this section",
    },
    backgroundImageURL: {
      type: GraphQLString,
      description: "A background image URL for this section",
    },
    buttonText: {
      type: GraphQLString,
      description: "Text for the CTA ",
    },
  },
})
