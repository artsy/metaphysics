import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkDuplicatePairType } from "./artworkDuplicatePairType"

export const artworkDuplicatePair: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtworkDuplicatePairType,
  description: "Get a single artwork duplicate pair by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork duplicate pair",
    },
  },
  resolve: async (_root, { id }, { artworkDuplicatePairLoader }) => {
    if (!artworkDuplicatePairLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return artworkDuplicatePairLoader(id)
  },
}
