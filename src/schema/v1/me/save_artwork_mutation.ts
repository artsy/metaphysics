import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/v1/artwork/index"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "SaveArtwork",
  description:
    "Save (or remove) an artwork to (from) a users default collection.",
  inputFields: {
    artwork_id: {
      type: GraphQLString,
    },
    remove: {
      type: GraphQLBoolean,
    },
  },
  outputFields: {
    artwork: {
      type: ArtworkType,
      resolve: ({ artwork_id }, _, { artworkLoader }) =>
        artworkLoader(artwork_id),
    },
  },
  mutateAndGetPayload: (
    { artwork_id, remove },
    { userID, saveArtworkLoader, deleteSavedArtworkLoader }
  ) => {
    if (!deleteSavedArtworkLoader || !saveArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const loader = remove ? deleteSavedArtworkLoader : saveArtworkLoader
    return loader(artwork_id, { user_id: userID }).then(() => ({ artwork_id }))
  },
})
