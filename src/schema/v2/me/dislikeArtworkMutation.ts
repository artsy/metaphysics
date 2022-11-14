import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"
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
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
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
    return loader(artwork_id, { user_id: userID }).then(() => ({ artwork_id }))
  },
})
