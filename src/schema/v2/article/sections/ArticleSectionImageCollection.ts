import { ResolverContext } from "types/graphql"
import { GraphQLObjectType, GraphQLString } from "graphql"

export const ArticleSectionImageCollection = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionImageCollection",
  isTypeOf: (data) => {
    return data.type === "image_collection"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
