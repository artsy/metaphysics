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
    { artistIds, imageS3Bucket, imageS3Key, partnerId },
    { createArtworkLoader, addImageToArtworkLoader }
  ) => {
    if (!createArtworkLoader || !addImageToArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    // Step 1: Create the artwork with artist IDs
    const createArtworkData = {
      artists: artistIds,
      partner: partnerId,
    }

    try {
      const artwork = await createArtworkLoader(createArtworkData)

      const imageData = {
        source_bucket: imageS3Bucket,
        source_key: imageS3Key,
      }

      try {
        await addImageToArtworkLoader(artwork._id, imageData)

        return { artworkId: artwork._id }
      } catch (imageError) {
        // Handle image upload error
        const formattedImageErr = formatGravityError(imageError)
        if (formattedImageErr) {
          return { ...formattedImageErr, _type: "GravityMutationError" }
        } else {
          throw new Error(imageError)
        }
      }
    } catch (artworkError) {
      // Handle artwork creation error
      const formattedArtworkErr = formatGravityError(artworkError)
      if (formattedArtworkErr) {
        return { ...formattedArtworkErr, _type: "GravityMutationError" }
      } else {
        throw new Error(artworkError)
      }
    }
  },
})
