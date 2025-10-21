import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Artwork from "./index"

interface RepositionArtworkImagesMutationInputProps {
  artworkId: string
  imageIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionArtworkImagesSuccess",
  isTypeOf: ({ artworkId }) => !!artworkId,
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: ({ artworkId }, _args, { artworkLoader }) =>
        artworkLoader(artworkId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionArtworkImagesFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionArtworkImagesResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionArtworkImagesMutation = mutationWithClientMutationId<
  RepositionArtworkImagesMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionArtworkImagesMutation",
  description: "Reposition artwork images, determining their display order.",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork.",
    },
    imageIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "An ordered array of image IDs representing the new display order.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the artwork with repositioned images. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkId, imageIds },
    { repositionArtworkImagesLoader }
  ) => {
    if (!repositionArtworkImagesLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      artworkId,
    }

    const data = {
      image_ids: imageIds,
    }

    try {
      const response = await repositionArtworkImagesLoader(identifiers, data)

      return {
        ...response,
        artworkId,
      }
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
