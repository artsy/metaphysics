import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ViewingRoomType } from "schema/v2/viewingRoom"

interface RemoveArtworkFromViewingRoomMutationInputProps {
  viewingRoomID: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromViewingRoomSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    viewingRoom: {
      type: ViewingRoomType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromViewingRoomFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveArtworkFromViewingRoomResponseOrError",
  types: [SuccessType, FailureType],
})

export const removeArtworkFromViewingRoomMutation = mutationWithClientMutationId<
  RemoveArtworkFromViewingRoomMutationInputProps,
  any,
  ResolverContext
>({
  name: "RemoveArtworkFromViewingRoom",
  description: "Removes an artwork from a viewing room.",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the viewing room.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to remove from the viewing room.",
    },
  },
  outputFields: {
    viewingRoomOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the viewing room that the artwork was removed from. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { viewingRoomID, artworkId },
    { removeArtworkFromViewingRoomLoader, viewingRoomLoader }
  ) => {
    if (!removeArtworkFromViewingRoomLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { viewingRoomID, artworkId }

    try {
      await removeArtworkFromViewingRoomLoader(identifiers)
      const viewingRoom = await viewingRoomLoader(viewingRoomID)
      return viewingRoom
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
