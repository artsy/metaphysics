import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityVideoType } from "../cityVideo"

// Returns the city's full, refreshed video list, mirroring
// cityArticleMutationResponseOrError.ts — there's no "City" GraphQL object
// here to refetch through.
export const CityVideoMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityVideoMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ citySlug }) => citySlug,
    },
    videos: {
      description: "The city's videos, in their new order.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CityVideoType))
      ),
      resolve: ({ videos }) => videos,
    },
  }),
})

export const CityVideoMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CityVideoMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const CityVideoMutationResponseOrErrorType = new GraphQLUnionType({
  name: "CityVideoMutationResponseOrError",
  types: [CityVideoMutationSuccessType, CityVideoMutationFailureType],
})
