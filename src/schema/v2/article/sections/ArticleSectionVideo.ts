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
    coverImageUrl: {
      type: GraphQLString,
      resolve: ({ cover_image_url }) => cover_image_url,
    },
    layout: {
      type: GraphQLString,
    },
    backgroundColor: {
      type: GraphQLString,
      resolve: ({ background_color }) => background_color,
    },
  }),
})
