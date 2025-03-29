import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"

interface CreateArtworkMutationInputProps {
  artistIds: string[]
  partnerId: string
  imageS3Bucket: string
  imageS3Key: string
  partnerShowId?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkSuccess",
  isTypeOf: ({ artworkId }) => !!artworkId,
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: ({ artworkId }, _args, { artworkLoader }) =>
        artworkLoader(artworkId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const createArtworkMutation = mutationWithClientMutationId<
  CreateArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateArtworkMutation",
  description: "Creates a new artwork with an associated image.",
  inputFields: {
    artistIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: "The IDs of the artists associated with the artwork.",
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner under which the artwork is created.",
    },
    partnerShowId: {
      type: GraphQLString,
      description:
        "If present, the newly created artwork will be added to this show.",
    },
    imageS3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 bucket where the artwork image is stored.",
    },
    imageS3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The S3 key for the artwork image.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the created artwork. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artistIds, imageS3Bucket, imageS3Key, partnerId, partnerShowId },
    {
      createArtworkLoader,
      addImageToArtworkLoader,
      addArtworkToPartnerShowLoader,
    }
  ) => {
    if (
      !createArtworkLoader ||
      !addImageToArtworkLoader ||
      !addArtworkToPartnerShowLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    const handleError = (error) => {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }
      throw new Error(error)
    }

    const createArtwork = async () => {
      const data = { artists: artistIds, partner: partnerId }
      return await createArtworkLoader(data)
    }

    const addImageToArtwork = async (artworkId: string) => {
      const imageData = { source_bucket: imageS3Bucket, source_key: imageS3Key }
      return await addImageToArtworkLoader(artworkId, imageData)
    }

    const addArtworkToShow = async (artworkId: string) => {
      const identifiers = { showId: partnerShowId, artworkId, partnerId }
      return await addArtworkToPartnerShowLoader(identifiers)
    }

    try {
      const artwork = await createArtwork()
      await addImageToArtwork(artwork._id)
      if (partnerShowId) {
        await addArtworkToShow(artwork._id)
      }
      return { artworkId: artwork._id }
    } catch (error) {
      return handleError(error)
    }
  },
})
