import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

export const HighlightsType = new GraphQLObjectType({
  name: "Highlights",
  fields: {},
})

export const HighlightsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: HighlightsType,
  resolve: () => ({}),
}
