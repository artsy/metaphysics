// DEPRECATED: This mutation is deprecated. Use CreateArtworkImportImageMatchesV2 for single image matches instead.
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const ImageInputType = new GraphQLInputObjectType({
  name: "MatchArtworkImportImagesImageInput",
  fields: {
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The image filename",
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the uploaded image asset",
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket of the uploaded image asset",
    },
    rowID: {
      type: GraphQLString,
      description:
        "ID of the row to associate the images with (required if images don't already exist)",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MatchArtworkImportImagesSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
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
  name: "MatchArtworkImportImagesFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MatchArtworkImportImagesResponseOrError",
  types: [SuccessType, FailureType],
})

export const MatchArtworkImportImagesMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MatchArtworkImportImages",
  deprecationReason:
    "This mutation is deprecated. Use CreateArtworkImportImageMatchesV2 for single image matches instead.",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    images: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ImageInputType))
      ),
      description: "Array of image objects to match",
    },
  },
  outputFields: {
    matchArtworkImportImagesOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, images },
    { artworkImportMatchImagesLoader }
  ) => {
    if (!artworkImportMatchImagesLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      images: images.map(({ fileName, s3Key, s3Bucket, rowID }) => ({
        file_name: fileName,
        s3_key: s3Key,
        s3_bucket: s3Bucket,
        ...(rowID && { row_id: rowID }),
      })),
    }

    try {
      return {
        ...(await artworkImportMatchImagesLoader(artworkImportID, gravityArgs)),
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
