import {
  GraphQLBoolean,
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

const AccountMutationDeleteSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AccountMutationSuccess",
  isTypeOf: (data) => {
    return data._type !== "GravityMutationError"
  },
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  }),
})

const AccountMutationFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AccountMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

export const AccountMutationType = new GraphQLUnionType({
  name: "AccountMutationType",
  types: [AccountMutationDeleteSuccessType, AccountMutationFailureType],
})

export const deleteUserAccountMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteAccount",
  description: "Delete User Artsy Account",
  inputFields: {
    explanation: {
      description: "Reason for deleting the account.",
      type: GraphQLString,
    },
    password: {
      description: "Password.",
      type: GraphQLString,
    },
    url: {
      description: "Referrer location",
      type: GraphQLString,
    },
  },
  outputFields: {
    userAccountOrError: {
      type: AccountMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (args, { deleteUserAccountLoader }) => {
    if (!deleteUserAccountLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return deleteUserAccountLoader(args).catch((error) => {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    })
  },
})
