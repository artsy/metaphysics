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
import {
  UserInterest,
  UserInterestCategory,
  userInterestType,
} from "../userInterests"
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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserInterestsSuccess",
  fields: () => ({
    userInterests: {
      type: new GraphQLNonNull(new GraphQLList(userInterestType)),
      resolve: (userInterests) => userInterests,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createUserInterestsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const UserInterestInputType = new GraphQLInputObjectType({
  name: "UserInterestInput",
  fields: userInterestInputFields,
})

const UserInterestsOrErrorType = new GraphQLUnionType({
  name: "createUserInterestsResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? FailureType : SuccessType,
})

export const createUserInterestsMutation = mutationWithClientMutationId<
  Input,
  UserInterest[] | null,
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
        args.userInterests.map((userInterest) => {
          const gravityPayload = Object.keys(userInterest).reduce(
            (acc, key) => ({ ...acc, [snakeCase(key)]: userInterest[key] }),
            {}
          )
          return meCreateUserInterestLoader(gravityPayload)
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
