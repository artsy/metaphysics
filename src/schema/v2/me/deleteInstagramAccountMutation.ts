import {
  GraphQLBoolean,
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

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteInstagramAccountSuccess",
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: ({ success }) => success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteInstagramAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteInstagramAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteInstagramAccountFailure"
    }
    return "DeleteInstagramAccountSuccess"
  },
})

export const deleteInstagramAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteInstagramAccount",
  description: "Disconnect an Instagram account from a partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Instagram account to delete",
    },
  },
  outputFields: {
    instagramAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: a boolean indicating the account was deleted",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteInstagramAccountLoader }) => {
    if (!deleteInstagramAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteInstagramAccountLoader(id)
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
