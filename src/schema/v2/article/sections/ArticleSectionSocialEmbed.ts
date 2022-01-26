import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionSocialEmbed = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionSocialEmbed",
  isTypeOf: (data) => {
    return data.type === "social_embed"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
