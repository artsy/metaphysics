import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import {
  UserInterest,
  UserInterestEdge,
  userInterestType,
} from "../userInterests"

interface Input {
  id: string
  private?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateUserInterestSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    userInterest: {
      type: userInterestType,
      resolve: (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateUserInterestFailure",
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

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateUserInterestResponseOrError",
  types: [SuccessType, ErrorType],
})

export const updateUserInterestMutation = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "UpdateUserInterestMutation",
  description:
    "Updates a UserInterest on the logged in User's CollectorProfile.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    private: { type: GraphQLBoolean },
  },
  outputFields: {
    userInterestEdge: {
      type: UserInterestEdge,
      resolve: (result) => result,
    },
    userInterestOrError: {
      type: ResponseOrErrorType,
      description: "On success: the new state of the UserInterest",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, private: isPrivate },
    { meUpdateUserInterestLoader }
  ) => {
    if (!meUpdateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const userInterest: UserInterest = await meUpdateUserInterestLoader?.(
        id,
        { private: isPrivate }
      )

      return userInterest
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
