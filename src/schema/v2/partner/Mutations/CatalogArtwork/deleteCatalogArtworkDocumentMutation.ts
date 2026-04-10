import {
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

interface DeleteCatalogArtworkDocumentMutationInputProps {
  catalogArtworkId: string
  documentId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteCatalogArtworkDocumentSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    document: {
      type: CatalogArtworkDocumentType,
      resolve: (document) => document,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteCatalogArtworkDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteCatalogArtworkDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteCatalogArtworkDocumentMutation = mutationWithClientMutationId<
  DeleteCatalogArtworkDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteCatalogArtworkDocumentMutation",
  description: "Deletes a catalog artwork document.",
  inputFields: {
    catalogArtworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the catalog artwork.",
    },
    documentId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the document to delete.",
    },
  },
  outputFields: {
    documentOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted document. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { catalogArtworkId, documentId },
    { deleteCatalogArtworkDocumentLoader }
  ) => {
    if (!deleteCatalogArtworkDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteCatalogArtworkDocumentLoader(
        { id: documentId },
        { catalog_artwork_id: catalogArtworkId }
      )
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
