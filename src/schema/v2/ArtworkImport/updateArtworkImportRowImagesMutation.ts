import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const ImagePositionInputType = new GraphQLInputObjectType({
  name: "ImagePositionInput",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the image to update",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "The new position for the image (0-based)",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowImagesSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artworkImport: {
      type: ArtworkImportType,
      resolve: ({ artworkImportID }, _args, { artworkImportLoader }) => {
        if (!artworkImportLoader) return null
        return artworkImportLoader(artworkImportID)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowImagesFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportRowImagesResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportRowImagesMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportRowImages",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    images: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ImagePositionInputType))
      ),
      description: "Array of image position updates",
    },
  },
  outputFields: {
    updateArtworkImportRowImagesOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, images },
    { artworkImportBatchUpdateImageMatchesLoader }
  ) => {
    if (!artworkImportBatchUpdateImageMatchesLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await artworkImportBatchUpdateImageMatchesLoader(artworkImportID, {
        images,
      })

      return {
        artworkImportID,
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
