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

interface AddArtworkToViewingRoomMutationInputProps {
  viewingRoomID: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToViewingRoomSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    viewingRoom: {
      type: ViewingRoomType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToViewingRoomFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AddArtworkToViewingRoomResponseOrError",
  types: [SuccessType, FailureType],
})

export const addArtworkToViewingRoomMutation = mutationWithClientMutationId<
  AddArtworkToViewingRoomMutationInputProps,
  any,
  ResolverContext
>({
  name: "AddArtworkToViewingRoom",
  description: "Adds an artwork to a viewing room.",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the viewing room.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to add to the viewing room.",
    },
  },
  outputFields: {
    viewingRoomOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the viewing room that the artwork was added to. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { viewingRoomID, artworkId },
    { addArtworkToViewingRoomLoader, viewingRoomLoader }
  ) => {
    if (!addArtworkToViewingRoomLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { viewingRoomID, artworkId }

    try {
      await addArtworkToViewingRoomLoader(identifiers)
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
