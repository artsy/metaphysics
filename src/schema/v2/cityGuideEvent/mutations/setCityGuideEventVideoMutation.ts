import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  id: string
  videoID: string
}

export const setCityGuideEventVideoMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "setCityGuideEventVideo",
  description:
    "Set (or replace) a city guide event's video. Needs the editorial " +
    "or content-manager role. The Video must already exist — create it " +
    "with createVideo first.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The event's id or slug.",
    },
    videoID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The Gravity Video's id.",
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, videoID }, context) => {
    if (!context.setCityGuideEventVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.setCityGuideEventVideoLoader(id, {
        video_id: videoID,
      })
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
