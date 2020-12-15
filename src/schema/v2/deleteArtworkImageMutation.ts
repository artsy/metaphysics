import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const ArtworkMutationDeleteSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkMutationDeleteSuccess",
  isTypeOf: (data) => {
    return data.image_url
  },
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  }),
})

const ArtworkMutationFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const ArtworkMutationType = new GraphQLUnionType({
  name: "ArtworkMutationType",
  types: [ArtworkMutationDeleteSuccessType, ArtworkMutationFailureType],
})

interface DeleteArtworkImageMutationInput {
  artworkID: string
  imageID: string
}

export const DeleteArtworkImageMutation = mutationWithClientMutationId<
  DeleteArtworkImageMutationInput,
  any,
  ResolverContext
>({
  name: "DeleteArtworkImage",
  description: "Deletes an image from an artwork in my collection",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkOrError: {
      type: ArtworkMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID, imageID },
    { deleteArtworkImageLoader }
  ) => {
    if (!deleteArtworkImageLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteArtworkImageLoader({ artworkID, imageID })

      // Response from DELETE isn't internalID of deleted artwork and as such
      // we don't want to match on the ArtworkMutationSuccess type,
      // which looks for an `id` property.
      delete response.id

      return {
        ...response,
        artworkId: artworkID,
      }
    } catch (error) {
      console.error(error)
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
