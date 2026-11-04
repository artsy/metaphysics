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
import { EmailAccountType } from "./emailAccount"

interface Input {
  code: string
  state: string
  redirectUri: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteEmailOAuthSuccess",
  fields: () => ({
    emailAccount: {
      type: EmailAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteEmailOAuthFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CompleteEmailOAuthResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CompleteEmailOAuthFailure"
    }
    return "CompleteEmailOAuthSuccess"
  },
})

export const completeEmailOAuthMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CompleteEmailOAuth",
  description:
    "Complete the email OAuth flow by exchanging the authorization code for an account",
  inputFields: {
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The OAuth authorization code returned by the email provider",
    },
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth state parameter returned by the email provider",
    },
    redirectUri: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The OAuth redirect URI (must match the one used during initiation)",
    },
  },
  outputFields: {
    emailAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the connected email account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { code, state, redirectUri },
    { completeEmailOAuthLoader }
  ) => {
    if (!completeEmailOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await completeEmailOAuthLoader({
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
