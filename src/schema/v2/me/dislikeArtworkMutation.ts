import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "DislikeArtwork",
  description: "Add (or remove) an artwork to (from) a users dislikes.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    remove: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
  outputFields: {
    artwork: {
      type: ArtworkType,
      resolve: ({ artwork_id }, _, { artworkLoader }) =>
        artworkLoader(artwork_id),
    },
  },
  mutateAndGetPayload: async (
    { artworkID: artwork_id, remove },
    { userID, dislikeArtworkLoader, deleteDislikedArtworkLoader }
  ) => {
    if (!deleteDislikedArtworkLoader || !dislikeArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const loader = remove ? deleteDislikedArtworkLoader : dislikeArtworkLoader
    try {
      return loader(artwork_id, { user_id: userID }).then(() => ({
        artwork_id,
      }))
    } catch (error) {
      throw error
    }
  },
})
