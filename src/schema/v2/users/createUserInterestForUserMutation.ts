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
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { UserType } from "../user"

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
    user: {
      type: UserType,
      resolve: ({ userId }, _args, { userByIDLoader }) => {
        if (!userByIDLoader) return null

        return userByIDLoader(userId)
      },
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
      description: "On success: UserInterest, User. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createUserInterestLoader }) => {
    if (!createUserInterestLoader) {
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )
    }

    try {
      const userInterest: UserInterest = await createUserInterestLoader({
        body: args.body,
        category: args.category,
        interest_id: args.interestId,
        interest_type: args.interestType,
        owner_type: args.ownerType,
        user_id: args.userId,
      })

      return { ...userInterest, userId: args.userId }
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
