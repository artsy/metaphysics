import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "../artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkImportImageMatchSuccess",
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
  name: "CreateArtworkImportImageMatchFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkImportImageMatchResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtworkImportImageMatchMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtworkImportImageMatch",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
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
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the row to associate the image with",
    },
  },
  outputFields: {
    createArtworkImportImageMatchOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fileName, s3Key, s3Bucket, rowID },
    { artworkImportCreateImageMatchLoader }
  ) => {
    if (!artworkImportCreateImageMatchLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return {
        ...(await artworkImportCreateImageMatchLoader(artworkImportID, {
          file_name: fileName,
          s3_key: s3Key,
          s3_bucket: s3Bucket,
          row_id: rowID,
        })),
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
