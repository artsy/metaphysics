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
import { meType } from "./index"

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

const CreateUserInterestFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateUserInterestFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const userInterestOrErrorType = new GraphQLUnionType({
  name: "UserInterestOrError",
  types: [userInterestType, CreateUserInterestFailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? CreateUserInterestFailureType
      : userInterestType,
})

export const createUserInterestsMutation = mutationWithClientMutationId<
  Input,
  typeof userInterestOrErrorType[] | null,
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
    userInterestsOrErrors: {
      type: new GraphQLNonNull(new GraphQLList(userInterestOrErrorType)),
      resolve: (userInterests) => userInterests,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (args, { meCreateUserInterestLoader }) => {
    if (!meCreateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const userInterestResponses = Promise.all(
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
            return { message: error.message, _type: "GravityMutationError" }
          }
        }
      })
    )

    return userInterestResponses
  },
})
