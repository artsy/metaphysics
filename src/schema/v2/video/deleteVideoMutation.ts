import {
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

interface DeleteVideoInput {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteVideoSuccess",
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
  name: "DeleteVideoFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteVideoResponseOrErrorType",
  types: [SuccessType, ErrorType],
})

export const deleteVideoMutation = mutationWithClientMutationId<
  DeleteVideoInput,
  any,
  ResolverContext
>({
  name: "DeleteVideoMutation",
  description: "Delete a video",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the video to delete",
    },
  },
  outputFields: {
    videoOrError: {
      type: ResponseOrErrorType,
      description: "Success or Error, on success the deleted Video is returned",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteVideoLoader }) => {
    if (!deleteVideoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const deletedVideo = await deleteVideoLoader(args.id)
      return deletedVideo
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
