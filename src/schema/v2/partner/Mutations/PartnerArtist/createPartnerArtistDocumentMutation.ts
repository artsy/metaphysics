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

interface CreatePartnerArtistDocumentMutationInputProps {
  partnerId: string
  artistId: string
  remoteDocumentUrl: string
  title: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtistDocumentSuccess",
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
  name: "CreatePartnerArtistDocumentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerArtistDocumentResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerArtistDocumentMutation = mutationWithClientMutationId<
  CreatePartnerArtistDocumentMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerArtistDocumentMutation",
  description: "Creates a partner artist document.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    artistId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artist.",
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
    { partnerId, artistId, remoteDocumentUrl, title },
    { createPartnerArtistDocumentLoader }
  ) => {
    if (!createPartnerArtistDocumentLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const artistIdentifiers = { partnerID: partnerId, artistID: artistId }

    const gravityArgs = {
      remote_document_url: remoteDocumentUrl,
      title,
    }

    try {
      const response = await createPartnerArtistDocumentLoader(
        artistIdentifiers,
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
