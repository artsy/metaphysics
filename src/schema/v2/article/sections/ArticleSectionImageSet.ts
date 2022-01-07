import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionImageSet = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionImageSet",
  isTypeOf: (data) => {
    return data.type === "image_set"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
