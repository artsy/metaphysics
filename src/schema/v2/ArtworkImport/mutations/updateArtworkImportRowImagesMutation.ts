import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "../artworkImport"

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
    rowID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the row to update images for",
    },
    sortedImageIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: "Array of image IDs in desired position order",
    },
  },
  outputFields: {
    updateArtworkImportRowImagesOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, rowID, sortedImageIDs },
    { artworkImportUpdateRowImagesLoader }
  ) => {
    if (!artworkImportUpdateRowImagesLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await artworkImportUpdateRowImagesLoader(
        { artworkImportID, rowID },
        {
          sorted_image_ids: sortedImageIDs,
        }
      )

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
