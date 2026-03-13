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

interface Input {
  partnerId: string
  redirectUri: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthorizeInstagramAccountSuccess",
  fields: () => ({
    authorizationUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The Instagram OAuth authorization URL to redirect the user to",
      resolve: ({ authorization_url }) => authorization_url,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthorizeInstagramAccountFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AuthorizeInstagramAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "AuthorizeInstagramAccountFailure"
    }
    return "AuthorizeInstagramAccountSuccess"
  },
})

export const authorizeInstagramAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "AuthorizeInstagramAccount",
  description:
    "Initiate the Instagram OAuth flow and return the authorization URL",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The partner ID to associate the account with",
    },
    redirectUri: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth redirect URI",
    },
  },
  outputFields: {
    instagramAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the Instagram OAuth authorization URL",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, redirectUri },
    { initiateInstagramOAuthLoader }
  ) => {
    if (!initiateInstagramOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await initiateInstagramOAuthLoader({
        partner_id: partnerId,
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
