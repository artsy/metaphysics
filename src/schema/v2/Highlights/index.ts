import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PopularArtistsField } from "./PopularArtists"

export const HighlightsType = new GraphQLObjectType({
  name: "Highlights",
  fields: {
    popularArtists: PopularArtistsField,
  },
})

export const HighlightsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: HighlightsType,
  resolve: () => ({}),
}
