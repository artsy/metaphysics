import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionText = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleSectionText",
  isTypeOf: (data) => {
    return data.type === "text"
  },
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    body: {
      type: GraphQLString,
    },
    layout: {
      type: GraphQLString,
    },
  }),
})
