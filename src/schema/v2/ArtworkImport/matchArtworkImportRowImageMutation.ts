// DEPRECATED: This mutation is deprecated. Use CreateArtworkImportImageMatchesV2 instead.
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
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MatchArtworkImportRowImageSuccess",
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
  name: "MatchArtworkImportRowImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MatchArtworkImportRowImageResponseOrError",
  types: [SuccessType, FailureType],
})

export const MatchArtworkImportRowImageMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MatchArtworkImportRowImage",
  deprecationReason:
    "This mutation is deprecated. Use CreateArtworkImportImageMatchesV2 instead.",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fileName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
      type: GraphQLString,
    },
  },
  outputFields: {
    matchArtworkImportRowImageOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fileName, s3Key, s3Bucket, rowID },
    { artworkImportRowMatchImageLoader }
  ) => {
    if (!artworkImportRowMatchImageLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      file_name: fileName,
      s3_key: s3Key,
      s3_bucket: s3Bucket,
      ...(rowID && { row_id: rowID }),
    }

    try {
      return {
        ...(await artworkImportRowMatchImageLoader(
          artworkImportID,
          gravityArgs
        )),
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
