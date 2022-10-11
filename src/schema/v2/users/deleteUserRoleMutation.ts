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
import { UserType } from "../user"

interface Input {
  id: string
  role_type: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserRoleSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserRoleFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteUserRoleResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteUserRoleMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteUserRoleMutation",
  description: "Delete a role associated with a user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    role_type: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userOrError: {
      type: ResponseOrErrorType,
      description: "On success: the user.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserRoleLoader }) => {
    if (!deleteUserRoleLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteUserRoleLoader?.({
        id: args.id,
        role_type: args.role_type,
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
