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
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshEmailAccountWatchSuccess",
  fields: () => ({
    emailAccount: {
      type: EmailAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshEmailAccountWatchFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RefreshEmailAccountWatchResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "RefreshEmailAccountWatchFailure"
    }
    return "RefreshEmailAccountWatchSuccess"
  },
})

export const refreshEmailAccountWatchMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "RefreshEmailAccountWatch",
  description: "Renew the change notifications of a connected email account",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email account",
    },
  },
  outputFields: {
    emailAccountOrError: {
      type: ResponseOrErrorType,
      description: "On success: the email account",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { refreshEmailAccountWatchLoader }) => {
    if (!refreshEmailAccountWatchLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await refreshEmailAccountWatchLoader(id)
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
