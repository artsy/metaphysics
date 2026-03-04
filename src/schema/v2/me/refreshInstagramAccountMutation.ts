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
import { InstagramAccountType } from "./instagramAccount"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshInstagramAccountSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    instagramAccount: {
      type: InstagramAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshInstagramAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RefreshInstagramAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "RefreshInstagramAccountFailure"
    }
    return "RefreshInstagramAccountSuccess"
  },
})

export const refreshInstagramAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "RefreshInstagramAccount",
  description: "Refresh the access token for a connected Instagram account",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the Instagram account to refresh",
    },
  },
  outputFields: {
    instagramAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the refreshed Instagram account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { refreshInstagramAccountLoader }) => {
    if (!refreshInstagramAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await refreshInstagramAccountLoader(id)
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
