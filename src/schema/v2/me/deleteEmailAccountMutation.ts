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
  name: "DeleteEmailAccountSuccess",
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: ({ success }) => success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteEmailAccountFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteEmailAccountResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteEmailAccountFailure"
    }
    return "DeleteEmailAccountSuccess"
  },
})

export const deleteEmailAccountMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteEmailAccount",
  description: "Disconnect an email account from a partner",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the email account to disconnect",
    },
  },
  outputFields: {
    emailAccountOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: a boolean indicating the account was disconnected",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteEmailAccountLoader }) => {
    if (!deleteEmailAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteEmailAccountLoader(id)
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
