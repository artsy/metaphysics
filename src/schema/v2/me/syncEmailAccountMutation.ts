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
  name: "SyncEmailAccountSuccess",
  fields: () => ({
    emailAccount: {
      type: EmailAccountType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "SyncEmailAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "SyncEmailAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "SyncEmailAccountFailure"
    }
    return "SyncEmailAccountSuccess"
  },
})

export const syncEmailAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "SyncEmailAccount",
  description:
    "Queue a background sync of the new mail of a connected email account. Temporary manual trigger until syncs start automatically.",
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
  mutateAndGetPayload: async ({ id }, { syncEmailAccountLoader }) => {
    if (!syncEmailAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await syncEmailAccountLoader(id)
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
