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
  name: "addUserRoleSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "addUserRoleFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "addUserRoleResponseOrError",
  types: [SuccessType, FailureType],
})

export const addUserRoleMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "addUserRoleMutation",
  description: "Add a role associated with a user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    role_type: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userOrError: {
      type: ResponseOrErrorType,
      description: "On success: the user",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { addUserRoleLoader }) => {
    if (!addUserRoleLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await addUserRoleLoader?.({
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
