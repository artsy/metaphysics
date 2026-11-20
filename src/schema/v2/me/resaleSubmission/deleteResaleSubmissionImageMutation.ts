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
import { ResaleSubmissionType } from "./resaleSubmission"

interface Input {
  id: string
  imageID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteResaleSubmissionImageSuccess",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteResaleSubmissionImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteResaleSubmissionImageResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteResaleSubmissionImageFailure"
    }
    return "DeleteResaleSubmissionImageSuccess"
  },
})

export const deleteResaleSubmissionImageMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteResaleSubmissionImage",
  description: "Remove a condition photo from a resale submission.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the resale submission.",
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the condition photo to remove.",
    },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the resale submission without the photo.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, imageID },
    { meDeleteResaleSubmissionImageLoader }
  ) => {
    if (!meDeleteResaleSubmissionImageLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await meDeleteResaleSubmissionImageLoader({ id, imageID })
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
