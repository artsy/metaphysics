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
  isTypeOf: (data) => data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
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
      partner_id: args.partnerID,
      s3_bucket: args.s3Bucket,
      s3_key: args.s3Key,
      file_name: args.fileName,
      parse_with_ai: args.parseWithAI,
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
