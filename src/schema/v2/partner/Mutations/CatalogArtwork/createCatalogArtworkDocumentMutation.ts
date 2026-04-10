import {
  GraphQLInt,
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
import { CatalogArtworkDocumentType } from "schema/v2/catalogArtworkDocument"

interface CreateCatalogArtworkDocumentMutationInputProps {
  catalogArtworkId: string
  s3Bucket: string
  s3Key: string
  filename: string
  title?: string
  fileSize?: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCatalogArtworkDocumentSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    document: {
      type: CatalogArtworkDocumentType,
      resolve: (document) => document,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCatalogArtworkDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateCatalogArtworkDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const createCatalogArtworkDocumentMutation = mutationWithClientMutationId<
  CreateCatalogArtworkDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateCatalogArtworkDocumentMutation",
  description: "Attaches a document to a catalog artwork.",
  inputFields: {
    catalogArtworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the catalog artwork.",
    },
    s3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket containing the document.",
    },
    s3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the uploaded document.",
    },
    filename: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Original filename of the document.",
    },
    title: {
      type: GraphQLString,
      description: "Label for the document.",
    },
    fileSize: {
      type: GraphQLInt,
      description: "File size in bytes.",
    },
  },
  outputFields: {
    documentOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the created document. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { catalogArtworkId, s3Bucket, s3Key, filename, title, fileSize },
    { createCatalogArtworkDocumentLoader }
  ) => {
    if (!createCatalogArtworkDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: Record<string, unknown> = {
      catalog_artwork_id: catalogArtworkId,
      s3_bucket: s3Bucket,
      s3_key: s3Key,
      filename,
    }

    if (title !== undefined) gravityArgs.title = title
    if (fileSize !== undefined) gravityArgs.file_size = fileSize

    try {
      const response = await createCatalogArtworkDocumentLoader(gravityArgs)
      return response
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
