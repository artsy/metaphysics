import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import {
  ArtistStoryInputAttributes,
  artistStoryInputFields,
  toGravityArtistStoryAttributes,
} from "./createArtistStoryMutation"
import { ArtistStoryMutationResponseOrErrorType } from "./artistStoryMutationResponseOrError"

interface InputProps extends ArtistStoryInputAttributes {
  clientMutationId?: string
  id: string
}

export const updateArtistStoryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateArtistStory",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ...artistStoryInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ArtistStoryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, id, ...attributes },
    { updateArtistStoryLoader, userID }
  ) => {
    if (!updateArtistStoryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    try {
      return await updateArtistStoryLoader(
        id,
        toGravityArtistStoryAttributes(attributes)
      )
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
