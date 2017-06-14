import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/artwork/index"

export default mutationWithClientMutationId({
  name: "SaveArtwork",
  decription: "Save (or remove) an artwork to (from) a users default collection.",
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
      resolve: ({ artwork_id }) => gravity(`artwork/${artwork_id}`),
    },
  },
  mutateAndGetPayload: ({ artwork_id, remove }, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return new Error("You need to be signed in to perform this action")
    const saveMethod = remove ? "DELETE" : "POST"
    return gravity
      .with(accessToken, {
        method: saveMethod,
      })(`/collection/saved-artwork/artwork/${artwork_id}`, {
        user_id: userID,
      })
      .then(() => ({ artwork_id }))
  },
})
