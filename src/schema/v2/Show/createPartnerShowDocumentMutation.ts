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

interface CreatePartnerShowDocumentMutationInputProps {
  partnerId: string
  showId: string
  remoteDocumentUrl: string
  title: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerShowDocumentSuccess",
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
  name: "CreatePartnerShowDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerShowDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerShowDocumentMutation = mutationWithClientMutationId<
  CreatePartnerShowDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerShowDocumentMutation",
  description: "Creates a partner show document.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    remoteDocumentUrl: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The URL of the document to upload.",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The title of the document.",
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
    { partnerId, showId, remoteDocumentUrl, title },
    { createPartnerShowDocumentLoader }
  ) => {
    if (!createPartnerShowDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const showIdentifiers = { partnerID: partnerId, showID: showId }

    const gravityArgs = {
      remote_document_url: remoteDocumentUrl,
      title,
    }

    try {
      const response = await createPartnerShowDocumentLoader(
        showIdentifiers,
        gravityArgs
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
