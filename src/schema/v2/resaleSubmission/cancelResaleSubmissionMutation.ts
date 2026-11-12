import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { toMutationError } from "./mutationError"
import { ResaleSubmissionType } from "./resaleSubmission"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CancelResaleSubmissionSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (submission) => submission,
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
})

interface InputProps {
  id: string
}

export const cancelResaleSubmissionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "CancelResaleSubmission",
  description:
    "Cancel an accepted resale submission. The submission is kept, with state CANCELED.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The resale submission's internalID",
    },
  },
  outputFields: {
    resaleSubmissionOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { cancelResaleSubmissionLoader }) => {
    if (!cancelResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await cancelResaleSubmissionLoader(id)
    } catch (error) {
      return toMutationError(error)
    }
  },
})
