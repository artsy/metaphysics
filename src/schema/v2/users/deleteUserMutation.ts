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
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    user: {
      type: UserType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteUserResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteUserMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteUserMutation",
  description: "Delete a user",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userOrError: {
      type: ResponseOrErrorType,
      description: "On success: a deleted user",
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
