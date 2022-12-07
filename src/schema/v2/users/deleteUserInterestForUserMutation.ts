import { GraphQLObjectType, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "../userInterests"
import { snakeCase } from "lodash"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { GraphQLUnionType } from "graphql"

interface Input {
  id: string
  anonymousSessionId?: string
  sessionId?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserInterestForUserSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    userInterest: {
      type: userInterestType,
      resolve: (userInterest) => userInterest,
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
    anonymousSessionId: { type: GraphQLString },
    sessionID: { type: GraphQLString },
  },
  outputFields: {
    userInterestOrError: {
      type: ResponseOrErrorType,
      description: "On success: UserInterest. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteUserInterestLoader }) => {
    if (!deleteUserInterestLoader) {
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const { id, ...gravityOptions } = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {} as GravityInput
    )

    try {
      const userInterest: UserInterest = await deleteUserInterestLoader(
        id,
        gravityOptions
      )

      return userInterest
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

interface GravityInput {
  id: string
  anonymous_session_id?: string
  session_id?: string
}
