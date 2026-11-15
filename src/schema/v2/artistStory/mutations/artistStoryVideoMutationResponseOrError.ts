import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtistStoryVideoType } from "../artistStoryVideo"

export const ArtistStoryVideoMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtistStoryVideoMutationSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    artistStoryID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artistStoryID }) => artistStoryID,
    },
    videos: {
      description:
        "The Story's videos of every role, header first, then motion, then process, each in order.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtistStoryVideoType))
      ),
      resolve: ({ videos }) => videos,
    },
  }),
})

export const ArtistStoryVideoMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtistStoryVideoMutationFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ArtistStoryVideoMutationResponseOrErrorType = new GraphQLUnionType(
  {
    name: "ArtistStoryVideoMutationResponseOrError",
    types: [
      ArtistStoryVideoMutationSuccessType,
      ArtistStoryVideoMutationFailureType,
    ],
  }
)
