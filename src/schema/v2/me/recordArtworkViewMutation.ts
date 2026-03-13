import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const recordArtworkViewMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RecordArtworkView",
  description: "Records a user viewing an artwork",
  inputFields: {
    artwork_id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artworkId }) => artworkId,
    },
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
      deprecationReason: "Use artworkId",
      resolve: ({ artworkId }) => artworkId,
    },
  },
  mutateAndGetPayload: async (args, { recordArtworkViewLoader }) => {
    if (!recordArtworkViewLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    await recordArtworkViewLoader({ artwork_id: args.artwork_id })

    return {
      artworkId: args.artwork_id,
    }
  },
})
