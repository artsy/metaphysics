import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionVideo = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleSectionVideo",
  isTypeOf: (data) => {
    return data.type === "video"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    caption: {
      type: GraphQLString,
    },
    cover_image_url: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
    background_color: {
      type: GraphQLString,
    },
  }),
})
