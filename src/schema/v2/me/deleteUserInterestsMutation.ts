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

interface Input {
  ids: [string]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserInterestsSuccess",
  fields: () => ({
    userInterests: {
      type: new GraphQLNonNull(new GraphQLList(userInterestType)),
      resolve: (userInterests) => userInterests,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteUserInterestsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const UserInterestsOrErrorType = new GraphQLUnionType({
  name: "deleteUserInterestsResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? FailureType : SuccessType,
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
    userInterestsOrError: {
      type: UserInterestsOrErrorType,
      description: "on success: returns the deleted user interests",
      resolve: (userInterests) => userInterests,
    },
  },
  mutateAndGetPayload: async (args, { meDeleteUserInterestLoader }) => {
    if (!meDeleteUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const uniqueIDs = uniq(args.ids)
    try {
      const userInterests = await Promise.all<Promise<UserInterest>>(
        uniqueIDs.map((userInterestId) =>
          meDeleteUserInterestLoader(userInterestId)
        )
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
