// @ts-check

import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/artwork/index"

export default mutationWithClientMutationId({
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
      resolve: (
        { artwork_id },
        _,
        _request,
        { rootValue: { artworkLoader } }
      ) => artworkLoader(artwork_id),
    },
  },
  mutateAndGetPayload: (
    { artwork_id, remove },
    _request,
    {
      rootValue: {
        accessToken,
        userID,
        saveArtworkLoader,
        deleteArtworkLoader,
      },
    }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const loader = remove ? deleteArtworkLoader : saveArtworkLoader
    return loader(artwork_id, { user_id: userID }).then(() => ({ artwork_id }))
  },
})
