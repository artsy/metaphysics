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
import { MailchimpAccountType } from "./mailchimpAccount"

interface Input {
  code: string
  state: string
  redirectUri: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteMailchimpOAuthSuccess",
  fields: () => ({
    mailchimpAccount: {
      type: MailchimpAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CompleteMailchimpOAuthFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CompleteMailchimpOAuthResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CompleteMailchimpOAuthFailure"
    }
    return "CompleteMailchimpOAuthSuccess"
  },
})

export const completeMailchimpOAuthMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CompleteMailchimpOAuth",
  description:
    "Complete the Mailchimp OAuth flow by exchanging the authorization code for an account",
  inputFields: {
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth authorization code returned by Mailchimp",
    },
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The OAuth state parameter returned by Mailchimp",
    },
    redirectUri: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The OAuth redirect URI (must match the one used during initiation)",
    },
  },
  outputFields: {
    mailchimpAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the connected Mailchimp account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { code, state, redirectUri },
    { completeMailchimpOAuthLoader }
  ) => {
    if (!completeMailchimpOAuthLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await completeMailchimpOAuthLoader({
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
