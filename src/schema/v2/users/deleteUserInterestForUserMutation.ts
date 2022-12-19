import { GraphQLObjectType, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "../userInterests"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { GraphQLUnionType } from "graphql"
import { UserType } from "../user"

interface Input {
  id: string
  userId?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserInterestForUserSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    userInterest: {
      type: userInterestType,
      resolve: (userInterest) => userInterest,
    },
    user: {
      type: UserType,
      resolve: ({ userId }, _args, { userByIDLoader }) => {
        if (!userId || !userByIDLoader) return null

        return userByIDLoader(userId)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserInterestForUserFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteUserInterestForUserResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteUserInterestForUser = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "DeleteUserInterestForUser",
  description: "Delete a UserInterest.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the UserInterest to delete.",
    },
    userId: {
      type: GraphQLString,
      description: "An optional ID of a User.",
    },
  },
  outputFields: {
    userInterestOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: UserInterest and optionally a User. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserInterestLoader }) => {
    if (!deleteUserInterestLoader) {
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )
    }

    try {
      const userInterest: UserInterest = await deleteUserInterestLoader(args.id)

      if (Object.keys(args).includes("userId")) {
        return { ...userInterest, userId: args.userId }
      } else {
        return userInterest
      }
    } catch (err) {
      const formattedErr = formatGravityError(err)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(err)
      }
    }
  },
})
