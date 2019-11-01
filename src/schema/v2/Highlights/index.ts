import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PopularArtistsField } from "./PopularArtists"
import { SuggestedGenesField } from "./SuggestedGenes"

export const HighlightsType = new GraphQLObjectType({
  name: "Highlights",
  fields: {
    popularArtists: PopularArtistsField,
    suggestedGenes: SuggestedGenesField,
  },
})

export const HighlightsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: HighlightsType,
  resolve: () => ({}),
}
