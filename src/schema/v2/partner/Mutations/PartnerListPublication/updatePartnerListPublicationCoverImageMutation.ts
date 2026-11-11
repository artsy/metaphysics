import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PartnerListPublicationType } from "schema/v2/partnerListPublication"

interface Input {
  partnerListID: string
  remoteImageS3Key: string
  remoteImageS3Bucket: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerListPublicationCoverImageSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerListPublication: {
      type: PartnerListPublicationType,
      resolve: (publication) => publication,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerListPublicationCoverImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerListPublicationCoverImageResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerListPublicationCoverImageMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdatePartnerListPublicationCoverImageMutation",
  description:
    "Uploads or replaces a private viewing room's cover image. Doesn't publish the room.",
  inputFields: {
    partnerListID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the private viewing room's partner list.",
    },
    remoteImageS3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the uploaded cover image.",
    },
    remoteImageS3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket containing the uploaded cover image.",
    },
  },
  outputFields: {
    partnerListPublicationOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the partner list publication. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerListID, remoteImageS3Key, remoteImageS3Bucket },
    { updatePartnerListPublicationCoverImageLoader }
  ) => {
    if (!updatePartnerListPublicationCoverImageLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await updatePartnerListPublicationCoverImageLoader(partnerListID, {
        remote_image_s3_key: remoteImageS3Key,
        remote_image_s3_bucket: remoteImageS3Bucket,
      })
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
