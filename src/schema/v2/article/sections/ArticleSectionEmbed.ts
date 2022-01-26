import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionEmbed = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleSectionEmbed",
  isTypeOf: (data) => {
    return data.type === "embed"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLString,
    },
    mobileHeight: {
      type: GraphQLString,
      resolve: ({ mobile_height }) => mobile_height,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
