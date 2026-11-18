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
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CancelResaleSubmissionSuccess",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CancelResaleSubmissionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CancelResaleSubmissionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CancelResaleSubmissionFailure"
    }
    return "CancelResaleSubmissionSuccess"
  },
})

export const cancelResaleSubmissionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CancelResaleSubmission",
  description:
    "Cancel an accepted resale submission. The submission is kept, with state CANCELED.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the resale submission to cancel.",
    },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the canceled resale submission.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { meCancelResaleSubmissionLoader }) => {
    if (!meCancelResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await meCancelResaleSubmissionLoader(id)
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
