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
  name: "CreateArtworkImportSuccess",
  isTypeOf: (data) => !!data.id || !!data.queued,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => {
        if (result.id) {
          return result
        }
      },
    },
    queued: {
      type: GraphQLBoolean,
      resolve: ({ queued }) => queued,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtworkImport",
  inputFields: {
    async: {
      type: GraphQLBoolean,
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fileName: {
      type: GraphQLString,
    },
    parseWithAI: {
      type: GraphQLBoolean,
    },
    parseWithAIModel: {
      type: GraphQLString,
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createArtworkImportLoader }) => {
    if (!createArtworkImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      async: args.async,
      partner_id: args.partnerID,
      s3_bucket: args.s3Bucket,
      s3_key: args.s3Key,
      file_name: args.fileName,
      parse_with_ai: args.parseWithAI,
      parse_with_ai_model: args.parseWithAIModel,
    }

    try {
      const result = await createArtworkImportLoader(gravityArgs)
      return result
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
