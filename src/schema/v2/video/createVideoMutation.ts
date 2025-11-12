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

interface CreateVideoMutationInput {
  title: string
  playerUrl: string
  description?: string
  width: number
  height: number
}

interface GravityCreateVideoInput {
  title: string
  player_embed_url: string
  description?: string
  width: number
  height: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateVideoSuccess",
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
  name: "CreateVideoFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateVideoResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createVideoMutation = mutationWithClientMutationId<
  CreateVideoMutationInput,
  any,
  ResolverContext
>({
  name: "CreateVideo",
  description: "Create a video",
  inputFields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    playerUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description: "URL suitable for embedding in an iframe",
    },
    description: { type: GraphQLString },
    width: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Video width in pixels",
    },
    height: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Video height in pixels",
    },
  },
  outputFields: {
    videoOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createVideoLoader }) => {
    if (!createVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { playerUrl, ...otherArgs } = args

    const gravityPayload: GravityCreateVideoInput = {
      ...otherArgs,
      player_embed_url: playerUrl,
    }

    try {
      const createdVideo = await createVideoLoader(gravityPayload)
      return createdVideo
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
