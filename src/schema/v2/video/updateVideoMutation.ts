import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { VideoType } from "../types/Video"

interface UpdateVideoMutationInput {
  id: string
  title?: string
  playerUrl?: string
  description?: string
  width?: number
  height?: number
}

interface GravityUpdateVideoInput {
  title?: string
  player_embed_url?: string
  description?: string
  width?: number
  height?: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateVideoSuccess",
  isTypeOf: (data) => {
    return data._id
  },
  fields: () => ({
    video: {
      type: VideoType,
      resolve: (video) => video,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateVideoFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateVideoResponseOrError",
  types: [SuccessType, ErrorType],
})

export const updateVideoMutation = mutationWithClientMutationId<
  UpdateVideoMutationInput,
  any,
  ResolverContext
>({
  name: "UpdateVideo",
  description: "Update a video",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the video to update",
    },
    title: { type: GraphQLString },
    playerUrl: {
      type: GraphQLString,
      description: "URL suitable for embedding in an iframe",
    },
    description: { type: GraphQLString },
    width: {
      type: GraphQLInt,
      description: "Video width in pixels",
    },
    height: {
      type: GraphQLInt,
      description: "Video height in pixels",
    },
  },
  outputFields: {
    videoOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateVideoLoader }) => {
    if (!updateVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { id, playerUrl, ...otherArgs } = args

    const gravityPayload: GravityUpdateVideoInput = {
      ...otherArgs,
    }

    if (playerUrl !== undefined) {
      gravityPayload.player_embed_url = playerUrl
    }

    try {
      const updatedVideo = await updateVideoLoader(id, gravityPayload)
      return updatedVideo
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
