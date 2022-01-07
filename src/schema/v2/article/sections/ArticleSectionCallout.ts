import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionCallout = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionCallout",
  isTypeOf: (data) => {
    return data.type === "callout"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    thumbnail_url: {
      type: GraphQLString,
    },
    text: {
      type: GraphQLString,
    },
    article: {
      type: GraphQLString,
    },
    hide_image: {
      type: GraphQLString,
    },
    top_stories: {
      type: GraphQLString,
    },
  }),
})
