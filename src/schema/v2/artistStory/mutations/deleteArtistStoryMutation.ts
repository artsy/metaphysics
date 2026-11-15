import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { canEditArtistStories } from "./assertCanEditArtistStories"
import { ArtistStoryMutationFailureType } from "./artistStoryMutationResponseOrError"

// Only the id: the Story's videos are gone, so its type can't be resolved.
const DeleteArtistStorySuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DeleteArtistStorySuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    artistStoryID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
  }),
})

const DeleteArtistStoryResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtistStoryResponseOrError",
  types: [DeleteArtistStorySuccessType, ArtistStoryMutationFailureType],
})

interface InputProps {
  clientMutationId?: string
  id: string
}

export const deleteArtistStoryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteArtistStory",
  description: "Delete an Artist Story, its videos and its images",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    responseOrError: {
      type: DeleteArtistStoryResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteArtistStoryLoader, userID }) => {
    if (!deleteArtistStoryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    canEditArtistStories(userID)

    try {
      return await deleteArtistStoryLoader(id, {})
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
