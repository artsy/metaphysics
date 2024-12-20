import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { GraphQLError } from "graphql"

export interface RemoveArtworkViewMutationInput {
  artwork_id: string
}

export const removeArtworkViewMutation = mutationWithClientMutationId<
  RemoveArtworkViewMutationInput,
  any,
  ResolverContext
>({
  name: "RemoveArtworkViewMutation",
  description: "Remove an artwork view.",
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
  mutateAndGetPayload: async ({ artwork_id }, { deleteArtworkViewLoader }) => {
    try {
      const response = await deleteArtworkViewLoader(artwork_id)

      return { artworkId: response.artwork_id }
    } catch (error) {
      throw new GraphQLError(`RemoveArtworkViewMutation error: ${error}`)
    }
  },
})
