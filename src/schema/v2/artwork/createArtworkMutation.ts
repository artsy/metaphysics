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
      type: GraphQLString,
      description: "The S3 bucket where the artwork image is stored.",
    },
    imageS3Key: {
      type: GraphQLString,
      description: "The S3 key for the artwork image.",
    },
    imageS3Buckets: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "The S3 buckets where the artwork images are stored. This is a list of bucket names.",
    },
    imageS3Keys: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "The S3 keys for the artwork images. This is a list of object keys.",
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
    {
      artistIds,
      partnerId,
      partnerShowId,
      imageS3Bucket,
      imageS3Key,
      imageS3Buckets,
      imageS3Keys,
    },
    {
      createArtworkLoader,
      addImageToArtworkLoader,
      addArtworkToPartnerShowLoader,
    }
  ) => {
    // Check if loaders are available
    if (
      !createArtworkLoader ||
      !addImageToArtworkLoader ||
      !addArtworkToPartnerShowLoader
    ) {
      return new Error("You need to be signed in to perform this action")
    }

    // Support for both singular and plural image S3 bucket/key inputs
    const buckets: string[] = []
    if (imageS3Buckets?.length) {
      buckets.push(...imageS3Buckets)
    } else if (imageS3Bucket) {
      buckets.push(imageS3Bucket)
    }

    const keys: string[] = []
    if (imageS3Keys?.length) {
      keys.push(...imageS3Keys)
    } else if (imageS3Key) {
      keys.push(imageS3Key)
    }

    // Validate image S3 bucket/key inputs
    if (!buckets.length) {
      return new Error(
        "You must provide either imageS3Bucket or non-empty imageS3Buckets."
      )
    }

    if (!keys.length) {
      return new Error(
        "You must provide either imageS3Key or non-empty imageS3Keys."
      )
    }

    if (buckets.length !== keys.length) {
      return new Error(
        "imageS3Buckets and imageS3Keys must have the same number of items."
      )
    }

    try {
      // Create artwork
      const artwork = await createArtworkLoader({
        artists: artistIds,
        partner: partnerId,
        sync_to_es: true,
      })

      // Attach all images
      await Promise.all(
        buckets.map((bucket, i) =>
          addImageToArtworkLoader(artwork._id, {
            source_bucket: bucket,
            source_key: keys[i],
          })
        )
      )

      // Optionally add artwork to partner show
      if (partnerShowId) {
        await addArtworkToPartnerShowLoader({
          showId: partnerShowId,
          artworkId: artwork._id,
          partnerId,
        })
      }

      return { artworkId: artwork._id }
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
