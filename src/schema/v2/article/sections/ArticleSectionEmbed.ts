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
    mobile_height: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
