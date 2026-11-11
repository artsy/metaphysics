import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { snakeCaseKeys } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import { ArtistStoryVideoMutationResponseOrErrorType } from "./artistStoryVideoMutationResponseOrError"
import {
  ArtistStoryVideoRoleEnum,
  refreshArtistStoryVideos,
} from "./createArtistStoryVideoMutation"

interface InputProps {
  clientMutationId?: string
  id: string
  role?: "header" | "motion" | "process"
  position?: number
  caption?: string | null
  quote?: string | null
  quoteAttribution?: string | null
}

export const updateArtistStoryVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateArtistStoryVideo",
  description:
    "Change a video's role, position, caption or quote on an Artist Story",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The placement's id (not the video's).",
    },
    role: { type: ArtistStoryVideoRoleEnum },
    position: {
      type: GraphQLInt,
      description:
        "Zero-based position among the Story's videos of the same role.",
    },
    caption: { type: GraphQLString, description: "Motion videos only." },
    quote: {
      type: GraphQLString,
      description: "Motion videos only. Plain text, max 250.",
    },
    quoteAttribution: {
      type: GraphQLString,
      description: "Motion videos only, and only with a quote.",
    },
  },
  outputFields: {
    responseOrError: {
      type: ArtistStoryVideoMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, id, ...attributes },
    { updateArtistStoryVideoLoader, artistStoryVideosLoader, userID }
  ) => {
    if (!updateArtistStoryVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    let placement
    try {
      placement = await updateArtistStoryVideoLoader(
        id,
        snakeCaseKeys(attributes)
      )
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
