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
import { ProfileType } from "schema/v2/profile"

interface UpdatePartnerProfileImageInputProps {
  profileId: string
  type: string
  remoteImageS3Key: string
  remoteImageS3Bucket: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerProfileImageSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    profile: {
      type: ProfileType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerProfileImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerProfileImageOrError",
  types: [SuccessType, FailureType],
})

export const UpdatePartnerProfileImageMutation = mutationWithClientMutationId<
  UpdatePartnerProfileImageInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerProfileImage",
  description: "Updates the icon or cover image for a partner's profile page",
  inputFields: {
    profileId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner's profile",
    },
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Can be of type Cover or Icon",
    },
    remoteImageS3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the image to be uploaded",
    },
    remoteImageS3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket containing the image to be uploaded",
    },
  },
  outputFields: {
    profileOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { profileId, type, remoteImageS3Bucket, remoteImageS3Key },
    { updatePartnerProfileImageLoader }
  ) => {
    if (!updatePartnerProfileImageLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerProfileImageLoader(profileId, {
        type,
        remote_image_s3_key: remoteImageS3Key,
        remote_image_s3_bucket: remoteImageS3Bucket,
      })

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
