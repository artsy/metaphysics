import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { calculateMeanArtworksVector } from "lib/infiniteDiscovery/calculateMeanArtworksVector"
import { ResolverContext } from "types/graphql"

export const TasteProfileVector: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(GraphQLFloat),
  args: {
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  },
  resolve: async (_root, { artworkIDs }) => {
    return calculateMeanArtworksVector(artworkIDs)
  },
}
