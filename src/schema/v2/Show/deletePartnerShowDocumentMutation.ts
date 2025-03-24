import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PartnerDocumentType } from "../partner/partnerDocumentsConnection"
import { ShowType } from "../show"

interface DeletePartnerShowDocumentMutationInputProps {
  partnerId: string
  showId: string
  documentId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowDocumentSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    document: {
      type: PartnerDocumentType,
      resolve: (document) => document,
    },
    show: {
      type: ShowType,
      resolve: ({ partner_show }) => partner_show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerShowDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerShowDocumentMutation = mutationWithClientMutationId<
  DeletePartnerShowDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerShowDocumentMutation",
  description: "Deletes a partner show document.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
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
    { partnerId, showId, documentId },
    { deletePartnerShowDocumentLoader }
  ) => {
    if (!deletePartnerShowDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { partnerID: partnerId, showID: showId, documentId }

    try {
      const response = await deletePartnerShowDocumentLoader(identifiers)

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
