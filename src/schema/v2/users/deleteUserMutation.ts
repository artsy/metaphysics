import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { UserType } from "../user"
import { mutationWithClientMutationId } from "graphql-relay"

interface DeleteUserMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteUserSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteUserFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteUserResponseOrError",
  types: [SuccessType, FailureType],
})

export default mutationWithClientMutationId<
  DeleteUserMutationInputProps,
  any | null,
  ResolverContext
>({
  name: "DeleteUser",
  description: "Delete a User",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userOrError: {
      type: ResponseOrErrorType,
      description: "On success: a deleted User",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserLoader }) => {
    if (!deleteUserLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteUserLoader(args.id)
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
