import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtistStoryType } from "../artistStory"

export const ArtistStoryMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtistStoryMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    artistStory: {
      type: ArtistStoryType,
      resolve: (story) => story,
    },
  }),
})

export const ArtistStoryMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtistStoryMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ArtistStoryMutationResponseOrErrorType = new GraphQLUnionType({
  name: "ArtistStoryMutationResponseOrError",
  types: [ArtistStoryMutationSuccessType, ArtistStoryMutationFailureType],
})
