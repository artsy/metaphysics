import {
  GraphQLInputObjectType,
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

interface DocumentInput {
  s3Bucket: string
  s3Key: string
  fileName?: string
}

interface Input {
  id: string
  documents?: DocumentInput[]
}

const DocumentInputType = new GraphQLInputObjectType({
  name: "GenerateArtworkDescriptionDocumentInput",
  fields: {
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket of the uploaded document.",
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the uploaded document.",
    },
    fileName: {
      type: GraphQLString,
      description: "Original filename of the document.",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "GenerateArtworkDescriptionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    generatedDescription: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "AI-generated artwork description suggestion. Not saved to the artwork until the user applies it.",
      resolve: ({ generated_description }) => generated_description,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "GenerateArtworkDescriptionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "GenerateArtworkDescriptionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "GenerateArtworkDescriptionFailure"
    }
    return "GenerateArtworkDescriptionSuccess"
  },
})

export const generateArtworkDescriptionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "GenerateArtworkDescription",
  description:
    "Generate an AI artwork description without saving it to the artwork",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The internal ID of the artwork to generate a description for",
    },
    documents: {
      type: new GraphQLList(new GraphQLNonNull(DocumentInputType)),
      description:
        "S3 PDFs to include as additional context for description generation.",
    },
  },
  outputFields: {
    artworkDescriptionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the generated artwork description",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, documents },
    { generateArtworkDescriptionLoader }
  ) => {
    if (!generateArtworkDescriptionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityArgs = documents?.length
      ? {
          documents: documents.map(({ s3Bucket, s3Key, fileName }) => ({
            s3_bucket: s3Bucket,
            s3_key: s3Key,
            ...(fileName && { file_name: fileName }),
          })),
        }
      : undefined

    try {
      const result = gravityArgs
        ? await generateArtworkDescriptionLoader(id, gravityArgs)
        : await generateArtworkDescriptionLoader(id)

      if (!result?.generated_description) {
        return {
          message: "Unable to generate artwork description",
          _type: "GravityMutationError",
        }
      }

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
