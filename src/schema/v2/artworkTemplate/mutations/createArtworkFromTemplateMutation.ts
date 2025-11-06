import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkType } from "schema/v2/artwork"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkFromTemplateSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkFromTemplateFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkFromTemplateResponseOrError",
  types: [SuccessType, FailureType],
})

interface CreateArtworkFromTemplateInput {
  partnerID: string
  artworkTemplateID: string
  imageS3Bucket?: string
  imageS3Key?: string
  imageS3Buckets?: string[]
  imageS3Keys?: string[]
}

export const CreateArtworkFromTemplateMutation = mutationWithClientMutationId<
  CreateArtworkFromTemplateInput,
  any,
  ResolverContext
>({
  name: "CreateArtworkFromTemplate",
  description: "Create an artwork from an artwork template.",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the partner.",
    },
    artworkTemplateID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the artwork template.",
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
      resolve: (result: any) => result,
    },
  },
  mutateAndGetPayload: async (
    args: CreateArtworkFromTemplateInput,
    { createArtworkFromTemplateLoader, addImageToArtworkLoader }
  ) => {
    if (!createArtworkFromTemplateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    // Support for both singular and plural image S3 bucket/key inputs
    const buckets: string[] = []
    if (args.imageS3Buckets?.length) {
      buckets.push(...args.imageS3Buckets)
    } else if (args.imageS3Bucket) {
      buckets.push(args.imageS3Bucket)
    }

    const keys: string[] = []
    if (args.imageS3Keys?.length) {
      keys.push(...args.imageS3Keys)
    } else if (args.imageS3Key) {
      keys.push(args.imageS3Key)
    }

    // Validate image S3 bucket/key inputs
    if (!addImageToArtworkLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    if (!buckets.length) {
      return {
        message:
          "You must provide either imageS3Bucket or non-empty imageS3Buckets.",
        _type: "GravityMutationError",
      }
    }

    if (!keys.length) {
      return {
        message: "You must provide either imageS3Key or non-empty imageS3Keys.",
        _type: "GravityMutationError",
      }
    }

    if (buckets.length !== keys.length) {
      return {
        message:
          "imageS3Buckets and imageS3Keys must have the same number of items.",
        _type: "GravityMutationError",
      }
    }

    try {
      const result = await createArtworkFromTemplateLoader({
        partnerId: args.partnerID,
        templateId: args.artworkTemplateID,
      })

      // Attach all images
      await Promise.all(
        buckets.map((bucket, i) =>
          addImageToArtworkLoader(result._id, {
            source_bucket: bucket,
            source_key: keys[i],
          })
        )
      )

      return result
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
