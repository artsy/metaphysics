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
    thumbnailUrl: {
      type: GraphQLString,
      resolve: ({ thumbnail_url }) => thumbnail_url,
    },
    text: {
      type: GraphQLString,
    },
    article: {
      type: GraphQLString,
    },
    hideImage: {
      type: GraphQLString,
      resolve: ({ hide_image }) => hide_image,
    },
    topStories: {
      type: GraphQLString,
      resolve: ({ top_stories }) => top_stories,
    },
  }),
})
