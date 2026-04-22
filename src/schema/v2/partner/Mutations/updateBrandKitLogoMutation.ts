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
import { BrandKitType } from "../brandKit"

interface Input {
  id: string
  remoteImageS3Key: string
  remoteImageS3Bucket: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateBrandKitLogoSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    brandKit: {
      type: BrandKitType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateBrandKitLogoFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateBrandKitLogoResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "UpdateBrandKitLogoFailure"
    }
    return "UpdateBrandKitLogoSuccess"
  },
})

export const updateBrandKitLogoMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateBrandKitLogo",
  description: "Upload or replace the logo for a brand kit",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the brand kit",
    },
    remoteImageS3Key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 key of the logo image to upload",
    },
    remoteImageS3Bucket: {
      type: new GraphQLNonNull(GraphQLString),
      description: "S3 bucket containing the logo image to upload",
    },
  },
  outputFields: {
    brandKitOrError: {
      type: ResponseOrErrorType,
      description: "On success: the brand kit with the updated logo",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, remoteImageS3Key, remoteImageS3Bucket },
    { uploadBrandKitLogoLoader }
  ) => {
    if (!uploadBrandKitLogoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await uploadBrandKitLogoLoader(id, {
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
