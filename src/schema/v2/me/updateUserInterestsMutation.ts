import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
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
import { userInterestType } from "../userInterests"
import { meType } from "./index"

interface UserInterestInput {
  id: string
  private?: boolean
}

interface Input {
  userInterests: UserInterestInput[]
}

export const UpdateUserInterestInputType = new GraphQLInputObjectType({
  name: "UpdateUserInterestInput",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    private: { type: GraphQLBoolean },
  },
})

const UpdateUserInterestFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "UpdateUserInterestsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const userInterestOrErrorType = new GraphQLUnionType({
  name: "UpdateUserInterestOrError",
  types: [userInterestType, UpdateUserInterestFailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? UpdateUserInterestFailureType
      : userInterestType,
})

export const updateUserInterestsMutation = mutationWithClientMutationId<
  Input,
  typeof userInterestOrErrorType[] | null,
  ResolverContext
>({
  name: "UpdateUserInterestsMutation",
  description: "Update user interests for multiple artists",
  inputFields: {
    userInterests: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(UpdateUserInterestInputType))
      ),
    },
  },
  outputFields: {
    userInterestsOrErrors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(userInterestOrErrorType))
      ),
      resolve: (userInterests) => userInterests,
    },
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (args, { meUpdateUserInterestLoader }) => {
    if (!meUpdateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const userInterestResponses = Promise.all(
      args.userInterests.map(async (userInterest) => {
        try {
          return await meUpdateUserInterestLoader(userInterest.id, {
            private: userInterest.private,
          })
        } catch (error) {
          const formattedErr = formatGravityError(error)

          if (formattedErr) {
            return { ...formattedErr, _type: "GravityMutationError" }
          } else {
            return {
              message: error.message,
              _type: "GravityMutationError",
            }
          }
        }
      })
    )

    return userInterestResponses
  },
})
