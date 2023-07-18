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

const deleteUserInterestsSuccess = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteUserInterestsSuccess",
  fields: () => ({
    userInterests: {
      type: new GraphQLNonNull(new GraphQLList(userInterestType)),
      resolve: (userInterests) => userInterests,
    },
  }),
})

const deleteUserInterestsFailure = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteUserInterestsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const deleteUserInterestOrErrorType = new GraphQLUnionType({
  name: "DeleteUserInterestOrErrorType",
  types: [deleteUserInterestsSuccess, deleteUserInterestsFailure],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? deleteUserInterestsFailure
      : deleteUserInterestsSuccess,
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
    ids: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
    userInterestsOrError: {
      type: deleteUserInterestOrErrorType,
      description: "on success: returns the deleted user interests",
      resolve: (userInterests) => userInterests,
    },
  },
  mutateAndGetPayload: async (args, { meDeleteUserInterestLoader }) => {
    if (!meDeleteUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const uniqueIDs = uniq(args.ids)

      const userInterests = Promise.all(
        uniqueIDs.map((userInterestId) => {
          return meDeleteUserInterestLoader(userInterestId)
        })
      )

      return userInterests
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
