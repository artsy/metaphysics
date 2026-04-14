import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import fetch from "node-fetch"
import config from "config"
import { ResolverContext } from "types/graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"

const ImageOwnerType = new GraphQLEnumType({
  name: "ImageOwnerType",
  values: {
    ARTWORK: { value: "ARTWORK" },
    SHOW: { value: "SHOW" },
  },
})

const OriginalImageUrlSuccessType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "OriginalImageUrlSuccess",
    fields: () => ({
      imageUrl: {
        type: new GraphQLNonNull(GraphQLString),
      },
    }),
  }
)

const OriginalImageUrlOrErrorType = new GraphQLUnionType({
  name: "OriginalImageUrlOrError",
  types: [OriginalImageUrlSuccessType, GravityMutationErrorType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") return "GravityMutationError"
    return "OriginalImageUrlSuccess"
  },
})

export const originalImageUrl: GraphQLFieldConfig<any, ResolverContext> = {
  type: OriginalImageUrlOrErrorType,
  description:
    "Resolves the original unprocessed image URL for an artwork or show install shot " +
    "by following the Gravity redirect server-side. Returns a direct signed S3 URL, " +
    "or an error if the image is not found or the request is unauthorized.",
  args: {
    ownerType: {
      type: new GraphQLNonNull(ImageOwnerType),
      description: "Whether the image belongs to an artwork or a show",
    },
    ownerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the artwork or show",
    },
    imageId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the image",
    },
  },
  resolve: async (
    _root,
    { ownerType, ownerId, imageId },
    { accessToken, appToken }: ResolverContext
  ) => {
    const path =
      ownerType === "ARTWORK"
        ? `artwork/${ownerId}/image/${imageId}/original.jpg`
        : `partner_show/${ownerId}/image/${imageId}/original.jpg`

    const url = `${config.GRAVITY_API_BASE}/${path}`

    const headers: Record<string, string> = {
      "X-XAPP-TOKEN": appToken || config.GRAVITY_XAPP_TOKEN,
    }
    if (accessToken) headers["X-ACCESS-TOKEN"] = accessToken

    try {
      const response = await fetch(url, { headers, redirect: "manual" })
      const { status } = response

      if (status === 401 || status === 403) {
        return {
          _type: "GravityMutationError",
          message: "Unauthorized",
          statusCode: status,
        }
      }

      if (status === 404) {
        return {
          _type: "GravityMutationError",
          message: "Image not found",
          statusCode: 404,
        }
      }

      const imageUrl = response.headers.get("location")

      if (!imageUrl) {
        return {
          _type: "GravityMutationError",
          message: "No redirect location returned by Gravity",
          statusCode: status,
        }
      }

      return { imageUrl }
    } catch (error) {
      return {
        _type: "GravityMutationError",
        message: error.message ?? "Unknown error fetching original image",
        statusCode: null,
      }
    }
  },
}
