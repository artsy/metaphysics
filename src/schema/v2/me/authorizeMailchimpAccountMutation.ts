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
  name: "AuthorizeMailchimpAccountSuccess",
  fields: () => ({
    authorizationUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The Mailchimp OAuth authorization URL to redirect the user to",
      resolve: ({ authorization_url }) => authorization_url,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuthorizeMailchimpAccountFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AuthorizeMailchimpAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "AuthorizeMailchimpAccountFailure"
    }
    return "AuthorizeMailchimpAccountSuccess"
  },
})

export const authorizeMailchimpAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "AuthorizeMailchimpAccount",
  description:
    "Initiate the Mailchimp OAuth flow and return the authorization URL",
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
    mailchimpAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the Mailchimp OAuth authorization URL",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, redirectUri },
    { initiateMailchimpOAuthLoader }
  ) => {
    if (!initiateMailchimpOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await initiateMailchimpOAuthLoader({
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
