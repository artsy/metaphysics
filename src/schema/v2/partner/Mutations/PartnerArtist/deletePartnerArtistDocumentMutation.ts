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
import { PartnerDocumentType } from "../../partnerDocumentsConnection"
import Partner from "../../partner"

interface DeletePartnerArtistDocumentMutationInputProps {
  partnerId: string
  artistId: string
  documentId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerArtistDocumentSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    document: {
      type: PartnerDocumentType,
      resolve: (document) => document,
    },
    partner: {
      type: Partner.type,
      resolve: ({ partnerId }, _args, { partnerLoader }) => {
        return partnerLoader(partnerId)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerArtistDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerArtistDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerArtistDocumentMutation = mutationWithClientMutationId<
  DeletePartnerArtistDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerArtistDocumentMutation",
  description: "Deletes a partner artist document.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    artistId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artist.",
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
    { partnerId, artistId, documentId },
    { deletePartnerArtistDocumentLoader }
  ) => {
    if (!deletePartnerArtistDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { partnerID: partnerId, artistID: artistId, documentId }

    try {
      const response = await deletePartnerArtistDocumentLoader(identifiers)

      return { ...response, partnerId }
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
