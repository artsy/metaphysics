import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { GraphQLError } from "graphql"

export interface RecordArtworkViewMutationInput {
  artwork_id: string
}

export const recordArtworkViewMutation = mutationWithClientMutationId<
  RecordArtworkViewMutationInput,
  any,
  ResolverContext
>({
  name: "RecordArtworkViewMutation",
  description: "Record an artwork view.",
  inputFields: {
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of artwork.",
    },
  },
  outputFields: {
    artwork_id: {
      description: "ID of viewed artwork.",
      type: new GraphQLNonNull(GraphQLString),
      deprecationReason: "Use artworkId.",
    },
    artworkId: {
      description: "ID of viewed artwork.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  mutateAndGetPayload: async ({ artwork_id }, { createArtworkViewLoader }) => {
    try {
      const response = await createArtworkViewLoader(artwork_id)

      return { artwork_id: response.artwork_id, artworkId: response.artwork_id }
    } catch (error) {
      throw new GraphQLError(`RecordArtworkViewMutation error: ${error}`)
    }
  },
})
