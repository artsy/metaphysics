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

interface UpdatePartnerArtistDocumentMutationInputProps {
  partnerId: string
  artistId: string
  documentId: string
  title?: string
  remoteDocumentUrl?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerArtistDocumentSuccess",
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
  name: "UpdatePartnerArtistDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerArtistDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerArtistDocumentMutation = mutationWithClientMutationId<
  UpdatePartnerArtistDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtistDocumentMutation",
  description: "Updates a partner artist document.",
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
    { partnerId, artistId, documentId, ...args },
    { updatePartnerArtistDocumentLoader }
  ) => {
    if (!updatePartnerArtistDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      partnerId: partnerId,
      artistId: artistId,
      documentId: documentId,
    }

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
      const response = await updatePartnerArtistDocumentLoader(
        identifiers,
        gravityArgs
      )

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
