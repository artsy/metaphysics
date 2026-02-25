import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

interface RepositionViewingRoomArtworksMutationInputProps {
  viewingRoomID: string
  artworkIDs: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionViewingRoomArtworksSuccess",
  isTypeOf: (data) => Array.isArray(data.artwork_ids),
  fields: () => ({
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ artwork_ids }) => artwork_ids,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionViewingRoomArtworksFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionViewingRoomArtworksResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionViewingRoomArtworksMutation = mutationWithClientMutationId<
  RepositionViewingRoomArtworksMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionViewingRoomArtworksMutation",
  description:
    "Reposition artworks in a viewing room, determining their display order.",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the viewing room.",
    },
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "An ordered array of artwork IDs representing the new display order.",
    },
  },
  outputFields: {
    viewingRoomArtworksOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the reordered artwork IDs. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { viewingRoomID, artworkIDs },
    { repositionViewingRoomArtworksLoader }
  ) => {
    if (!repositionViewingRoomArtworksLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await repositionViewingRoomArtworksLoader(viewingRoomID, {
        artwork_ids: artworkIDs,
      })
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
