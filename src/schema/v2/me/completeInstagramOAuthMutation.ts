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
  code: string
  state: string
  redirectUri: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteInstagramOAuthSuccess",
  fields: () => ({
    instagramAccount: {
      type: InstagramAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteInstagramOAuthFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CompleteInstagramOAuthResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CompleteInstagramOAuthFailure"
    }
    return "CompleteInstagramOAuthSuccess"
  },
})

export const completeInstagramOAuthMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CompleteInstagramOAuth",
  description:
    "Complete the Instagram OAuth flow by exchanging the authorization code for an account",
  inputFields: {
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth authorization code returned by Instagram",
    },
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth state parameter returned by Instagram",
    },
    redirectUri: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The OAuth redirect URI (must match the one used during initiation)",
    },
  },
  outputFields: {
    instagramAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the connected Instagram account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { code, state, redirectUri },
    { completeInstagramOAuthLoader }
  ) => {
    if (!completeInstagramOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await completeInstagramOAuthLoader({
        code,
        state,
        redirect_uri: redirectUri,
      })
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
