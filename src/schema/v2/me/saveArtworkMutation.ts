import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/v2/artwork/index"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "SaveArtwork",
  description:
    "Save (or remove) an artwork to (from) a users default collection.",
  inputFields: {
    artworkID: {
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
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_root, _options, { meLoader }) => meLoader?.(),
    },
  },
  mutateAndGetPayload: (
    { artworkID: artwork_id, remove },
    { userID, saveArtworkLoader, deleteSavedArtworkLoader }
  ) => {
    if (!deleteSavedArtworkLoader || !saveArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const loader = remove ? deleteSavedArtworkLoader : saveArtworkLoader
    return loader(artwork_id, { user_id: userID }).then(() => ({ artwork_id }))
  },
})
