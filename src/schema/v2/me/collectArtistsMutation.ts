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
  artistIDs: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "collectArtistsSuccess",
  fields: () => ({
    userInterests: {
      type: new GraphQLNonNull(new GraphQLList(userInterestType)),
      resolve: (userInterests) => userInterests,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "collectArtistsFailure",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const UserInterestsOrErrorType = new GraphQLUnionType({
  name: "collectArtistsResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError" ? FailureType : SuccessType,
})

export const collectArtistsMutation = mutationWithClientMutationId<
  Input,
  UserInterest[] | null,
  ResolverContext
>({
  name: "CollectArtistsMutation",
  description: "Collect Multiple Artists",
  inputFields: {
    artistIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
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
    const uniqueArtistIDs = uniq(args.artistIDs)

    try {
      const userInterests = await Promise.all(
        uniqueArtistIDs.map((artistID) => {
          const gravityPayload = {
            interest_id: artistID,
            interest_type: "Artist",
            category: "collected_before",
          }
          return meCreateUserInterestLoader(gravityPayload)
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
