import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PopularArtistsField } from "./PopularArtists"
import { BroadCollectingGenesField } from "./BroadCollectingGenes"

export const HighlightsType = new GraphQLObjectType({
  name: "Highlights",
  fields: {
    popularArtists: PopularArtistsField,
    broadCollectingGenes: BroadCollectingGenesField,
  },
})

export const HighlightsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: HighlightsType,
  resolve: () => ({}),
}
