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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MatchArtworkImportRowImageSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
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
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
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
  },
  outputFields: {
    matchArtworkImportRowImageOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { artworkImportID, rowID, fileName, s3Key, s3Bucket },
    { artworkImportRowMatchImageLoader }
  ) => {
    if (!artworkImportRowMatchImageLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      row_id: rowID,
      file_name: fileName,
      s3_key: s3Key,
      s3_bucket: s3Bucket,
    }

    try {
      return artworkImportRowMatchImageLoader(artworkImportID, gravityArgs)
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
