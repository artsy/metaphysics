import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import { UserInterestCategory, userInterestType } from "../userInterests"
import { userInterestInputFields } from "./createUserInterestMutation"

interface UserInterestInput {
  category: UserInterestCategory
  interestID: string
  interestType: "Artist" | "Gene"
  private?: boolean
}

interface Input {
  userInterests: UserInterestInput[]
}

export const UserInterestInputType = new GraphQLInputObjectType({
  name: "UserInterestInput",
  fields: userInterestInputFields,
})

const CreateUserInterestsSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "createUserInterestsSuccess",
  fields: () => ({
    userInterestsOrErrors: {
      type: new GraphQLNonNull(new GraphQLList(UserInterestOrErrorType)),
      resolve: (userInterests) => userInterests,
    },
  }),
})

const CreateUserInterestsFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "createUserInterestsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const CreateUserInterestFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "createUserInterestFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const UserInterestsOrErrorType = new GraphQLUnionType({
  name: "createUserInterestsResponseOrError",
  types: [CreateUserInterestsSuccessType, CreateUserInterestsFailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? CreateUserInterestsFailureType
      : CreateUserInterestsSuccessType,
})

const UserInterestOrErrorType = new GraphQLUnionType({
  name: "userInterestOrError",
  types: [userInterestType, CreateUserInterestFailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? CreateUserInterestFailureType
      : userInterestType,
})

export const createUserInterestsMutation = mutationWithClientMutationId<
  Input,
  typeof UserInterestOrErrorType[] | null,
  ResolverContext
>({
  name: "CreateUserInterestsMutation",
  description: "Collect Multiple Artists",
  inputFields: {
    userInterests: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(UserInterestInputType))
      ),
    },
  },
  outputFields: {
    userInterestsOrError: {
      type: UserInterestsOrErrorType,
      description: "on success: returns the user interest",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { meCreateUserInterestLoader }) => {
    if (!meCreateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const userInterestResponses = await Promise.all(
        args.userInterests.map(async (userInterest) => {
          const gravityPayload = Object.keys(userInterest).reduce(
            (acc, key) => ({ ...acc, [snakeCase(key)]: userInterest[key] }),
            {}
          )
          try {
            return await meCreateUserInterestLoader(gravityPayload)
          } catch (error) {
            const formattedErr = formatGravityError(error)

            if (formattedErr) {
              return { ...formattedErr, _type: "GravityMutationError" }
            } else {
              throw new Error(error)
            }
          }
        })
      )

      return userInterestResponses
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
