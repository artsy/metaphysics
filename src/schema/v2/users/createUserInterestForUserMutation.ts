import { GraphQLString, GraphQLObjectType, GraphQLUnionType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  UserInterest,
  UserInterestCategory,
  userInterestCategoryEnum,
  UserInterestInterestType,
  userInterestInterestTypeEnum,
  UserInterestOwnerType,
  userInterestOwnerTypeEnum,
  userInterestType,
} from "../userInterests"
import { snakeCase } from "lodash"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  body?: string
  category: UserInterestCategory
  interestId: string
  interestType: UserInterestInterestType
  ownerType: UserInterestOwnerType
  userId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserInterestForUserSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    userInterest: {
      type: userInterestType,
      resolve: (userInterest) => userInterest,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserInterestForUserFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createUserInterestForUserResponseOrError",
  types: [SuccessType, FailureType],
})

export const createUserInterestForUser = mutationWithClientMutationId<
  Input,
  UserInterest | null,
  ResolverContext
>({
  name: "CreateUserInterestForUser",
  description: "Creates a UserInterest for a user.",
  inputFields: {
    body: { type: GraphQLString, description: "Optional body for a note." },
    category: { type: new GraphQLNonNull(userInterestCategoryEnum) },
    interestId: { type: new GraphQLNonNull(GraphQLString) },
    interestType: { type: new GraphQLNonNull(userInterestInterestTypeEnum) },
    ownerType: { type: new GraphQLNonNull(userInterestOwnerTypeEnum) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    userInterestOrError: {
      type: ResponseOrErrorType,
      description: "On success: UserInterest. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createUserInterestLoader }) => {
    if (!createUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // snake_case keys for Gravity (keys are the same otherwise)
    const userInterestInput = Object.keys(args).reduce(
      (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
      {}
    )

    try {
      const userInterest: UserInterest = await createUserInterestLoader(
        userInterestInput
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
