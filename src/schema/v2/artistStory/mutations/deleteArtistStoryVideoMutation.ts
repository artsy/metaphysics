import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import { refreshArtistStoryVideos } from "./createArtistStoryVideoMutation"
import { ArtistStoryVideoMutationResponseOrErrorType } from "./artistStoryVideoMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  id: string
}

export const deleteArtistStoryVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteArtistStoryVideo",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The placement's id (not the video's).",
    },
  },
  outputFields: {
    responseOrError: {
      type: ArtistStoryVideoMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id },
    { deleteArtistStoryVideoLoader, artistStoryVideosLoader, userID }
  ) => {
    if (!deleteArtistStoryVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    let placement
    try {
      placement = await deleteArtistStoryVideoLoader(id, {})
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    return refreshArtistStoryVideos(
      placement.artist_story_id,
      artistStoryVideosLoader
    )
  },
})
