import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ShowType } from "../show"

interface AddInstallShotToPartnerShowMutationInputProps {
  showId: string
  s3Bucket?: string
  s3Key?: string
  caption?: string
  isDefault?: boolean
  imageUrl?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddInstallShotToPartnerShowSuccess",
  isTypeOf: ({ showId }) => !!showId,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: ({ showId }, _args, { showLoader }) => showLoader(showId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddInstallShotToPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AddInstallShotToPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const addInstallShotToPartnerShowMutation = mutationWithClientMutationId<
  AddInstallShotToPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "AddInstallShotToPartnerShowMutation",
  description: "Adds an installation shot to a partner show.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    s3Bucket: {
      type: GraphQLString,
      description: "The S3 bucket where the image is stored.",
    },
    s3Key: {
      type: GraphQLString,
      description: "The S3 key for the image to add as an installation shot.",
    },
    imageUrl: {
      type: GraphQLString,
      description:
        "Optional URL of the image to add as an installation shot. If provided, this will be used instead of the S3 bucket and key.",
    },
    isDefault: {
      type: GraphQLBoolean,
      description:
        "Optional flag to indicate if this installation shot should be set as the default (cover) image for the show.",
    },
    caption: {
      type: GraphQLString,
      description: "Optional caption for the installation shot.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show that the installation shot was added to. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      showId,
      s3Bucket,
      s3Key,
      caption,
      isDefault,
      imageUrl,
    }: AddInstallShotToPartnerShowMutationInputProps,
    { addInstallShotToPartnerShowLoader }
  ) => {
    if (!addInstallShotToPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      showId,
    }

    const data = {
      remote_image_s3_bucket: s3Bucket,
      remote_image_s3_key: s3Key,
      remote_image_url: imageUrl,
      default: isDefault,
      ...(caption && { caption }),
    }

    try {
      const response = await addInstallShotToPartnerShowLoader(
        identifiers,
        data
      )

      return {
        ...response,
        showId,
      }
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
