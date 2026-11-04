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
import { EmailAccountProviderEnum } from "./emailAccount"

interface Input {
  partnerId: string
  provider: string
  redirectUri: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthorizeEmailAccountSuccess",
  fields: () => ({
    authorizationUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth authorization URL to redirect the user to",
      resolve: ({ authorization_url }) => authorization_url,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthorizeEmailAccountFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AuthorizeEmailAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "AuthorizeEmailAccountFailure"
    }
    return "AuthorizeEmailAccountSuccess"
  },
})

export const authorizeEmailAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "AuthorizeEmailAccount",
  description: "Initiate the email OAuth flow and return the authorization URL",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to associate the account with",
    },
    provider: {
      type: new GraphQLNonNull(EmailAccountProviderEnum),
      description: "The email provider to connect",
    },
    redirectUri: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth redirect URI (host must be on artsy.net)",
    },
  },
  outputFields: {
    emailAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the OAuth authorization URL",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, provider, redirectUri },
    { initiateEmailOAuthLoader }
  ) => {
    if (!initiateEmailOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await initiateEmailOAuthLoader({
        partner_id: partnerId,
        provider,
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
