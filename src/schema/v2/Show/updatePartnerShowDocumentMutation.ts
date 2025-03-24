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

interface UpdatePartnerShowDocumentMutationInputProps {
  partnerId: string
  showId: string
  documentId: string
  title?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowDocumentSuccess",
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
  name: "UpdatePartnerShowDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerShowDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerShowDocumentMutation = mutationWithClientMutationId<
  UpdatePartnerShowDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerShowDocumentMutation",
  description: "Updates a partner show document.",
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
      description: "The ID of the document to update.",
    },
    title: {
      type: GraphQLString,
      description: "The updated title of the document.",
    },
    remoteDocumentUrl: {
      type: GraphQLString,
      description: "The URL of the document to upload.",
    },
  },
  outputFields: {
    documentOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated document. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, documentId, ...args },
    { updatePartnerShowDocumentLoader }
  ) => {
    if (!updatePartnerShowDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { partnerId, showId, documentId }

    const gravityArgs: {
      title?: string
      remoteDocumentUrl?: string
    } = {}

    if (args.title !== undefined) {
      gravityArgs.title = args.title
    }

    if (args.remoteDocumentUrl !== undefined) {
      gravityArgs.remoteDocumentUrl = args.remoteDocumentUrl
    }

    try {
      const response = await updatePartnerShowDocumentLoader(
        identifiers,
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
