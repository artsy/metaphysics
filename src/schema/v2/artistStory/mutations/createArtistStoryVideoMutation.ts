import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { snakeCaseKeys } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { ArtistStoryVideoRoleEnum } from "../artistStoryVideo"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import { ArtistStoryVideoMutationResponseOrErrorType } from "./artistStoryVideoMutationResponseOrError"

// The write already succeeded when this runs, so a failure refreshing the
// list surfaces as a plain error rather than a GravityMutationError.
export const refreshArtistStoryVideos = async (
  artistStoryID: string,
  artistStoryVideosLoader: ResolverContext["artistStoryVideosLoader"]
) => {
  const placements = await artistStoryVideosLoader({
    artist_story_id: artistStoryID,
  })

  return {
    artistStoryID,
    // Gravity orders them by role, then position. One without an embedded
    // Video would null a non-null field, so it's dropped.
    videos: placements.filter((placement) => placement.video != null),
  }
}

interface InputProps {
  clientMutationId?: string
  artistStoryID: string
  videoID: string
  role: "header" | "motion" | "process"
  caption?: string | null
  quote?: string | null
  quoteAttribution?: string | null
}

export const createArtistStoryVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createArtistStoryVideo",
  description:
    "Place a video on an Artist Story, at the end of its role's list",
  inputFields: {
    artistStoryID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    videoID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    role: { type: new GraphQLNonNull(ArtistStoryVideoRoleEnum) },
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
    { clientMutationId: _clientMutationId, ...attributes },
    { createArtistStoryVideoLoader, artistStoryVideosLoader, userID }
  ) => {
    if (!createArtistStoryVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    let placement
    try {
      placement = await createArtistStoryVideoLoader(snakeCaseKeys(attributes))
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
