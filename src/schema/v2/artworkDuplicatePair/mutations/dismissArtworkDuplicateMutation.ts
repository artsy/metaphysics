import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkDuplicatePairType } from "../artworkDuplicatePair"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissArtworkDuplicateSuccess",
  isTypeOf: (data) => !!data.duplicate_pair,
  fields: () => ({
    duplicatePair: {
      type: ArtworkDuplicatePairType,
      description: "The dismissed duplicate pair",
      resolve: ({ duplicate_pair }) => duplicate_pair,
    },
    message: {
      type: GraphQLString,
      description: "Success message",
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissArtworkDuplicateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
    errors: {
      type: new GraphQLList(GraphQLString),
      description: "List of errors that occurred executing the mutation",
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DismissArtworkDuplicateResponseOrError",
  types: [SuccessType, FailureType],
})

export const DismissArtworkDuplicateMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DismissArtworkDuplicate",
  description: "Dismiss an artwork duplicate pair",
  inputFields: {
    duplicatePairID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Duplicate pair ID to dismiss",
    },
  },
  outputFields: {
    dismissArtworkDuplicateOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { duplicatePairID },
    { dismissDuplicateLoader }
  ) => {
    if (!dismissDuplicateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await dismissDuplicateLoader(duplicatePairID)
      return result.body
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
