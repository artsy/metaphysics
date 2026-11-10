import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionType } from "./resaleSubmission"
import { mutationError } from "./mutationError"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (submission) => submission,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateResaleSubmissionResponseOrError",
  types: [SuccessType, FailureType],
})

const INTERNAL_ID_PATTERN = /^[0-9a-f]{24}$/i

interface InputProps {
  artworkID: string
}

export const createResaleSubmissionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "CreateResaleSubmission",
  description:
    "Ask Artsy to assess a My Collection work for resale. Returns the work's active submission if it already has one. A rejected assessment is a success.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The My Collection artwork's internalID (not a slug)",
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID },
    { createResaleSubmissionLoader }
  ) => {
    if (!createResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    if (!INTERNAL_ID_PATTERN.test(artworkID)) {
      return mutationError("artworkID must be an artwork internalID")
    }

    try {
      return await createResaleSubmissionLoader({ artwork_id: artworkID })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }
      throw new Error(error)
    }
  },
})
