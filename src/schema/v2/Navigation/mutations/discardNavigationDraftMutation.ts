import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscardNavigationDraftSuccess",
  isTypeOf: (data) => data.success === true,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscardNavigationDraftFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(GravityMutationErrorType),
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DiscardNavigationDraftResponseOrError",
  types: [SuccessType, ErrorType],
})

export const discardNavigationDraftMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DiscardNavigationDraft",
  description:
    "Discard a draft navigation version. Versions that have been published cannot be discarded.",
  inputFields: {
    versionID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation version to discard",
    },
  },
  outputFields: {
    discardNavigationDraftResponseOrError: {
      type: new GraphQLNonNull(ResponseOrErrorType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { discardNavigationDraftVersionLoader }
  ) => {
    if (!discardNavigationDraftVersionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await discardNavigationDraftVersionLoader(args.versionID)
      return { success: true }
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
