import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"

export const myCollectionDeleteArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionDeleteArtwork",
  description: "Deletes an artwork from my collection",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkOrError: {
      type: MyCollectionArtworkMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ artworkId }, { deleteArtworkLoader }) => {
    if (!deleteArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteArtworkLoader(artworkId)

      // Response from DELETE isn't internalID of deleted artwork and as such
      // we don't want to match on the MyCollectionArtworkMutationSuccess  type,
      // which looks for an `id` property.
      delete response.id

      return {
        ...response,
        artworkId: artworkId,
      }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
