import {
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
import { uniq } from "lodash"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "../userInterests"
import { meType } from "./index"

interface Input {
  ids: [string]
}

const deleteUserInterestFailure = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteUserInterestFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const deleteUserInterestOrErrorType = new GraphQLUnionType({
  name: "DeleteUserInterestOrErrorType",
  types: [userInterestType, deleteUserInterestFailure],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? deleteUserInterestFailure
      : userInterestType,
})

export const deleteUserInterestsMutation = mutationWithClientMutationId<
  Input,
  UserInterest[] | null,
  ResolverContext
>({
  name: "DeleteUserInterestsMutation",
  description:
    "Deletes multiple UserInterests on the logged in User's CollectorProfile.",
  inputFields: {
    ids: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    userInterestsOrErrors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(deleteUserInterestOrErrorType))
      ),
      resolve: (userInterests) => userInterests,
    },
  },
  mutateAndGetPayload: async (args, { meDeleteUserInterestLoader }) => {
    if (!meDeleteUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const uniqueIDs = uniq(args.ids)

    const userInterests = Promise.all(
      uniqueIDs.map(async (userInterestId) => {
        try {
          return await meDeleteUserInterestLoader(userInterestId)
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

    return userInterests
  },
})
