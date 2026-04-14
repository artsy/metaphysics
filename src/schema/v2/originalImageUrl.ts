import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import fetch from "node-fetch"
import config from "config"
import { ResolverContext } from "types/graphql"

const ImageOwnerType = new GraphQLEnumType({
  name: "ImageOwnerType",
  values: {
    ARTWORK: { value: "ARTWORK" },
    SHOW: { value: "SHOW" },
  },
})

export const originalImageUrl: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLString,
  description:
    "Resolves the original unprocessed image URL for an artwork or show install shot " +
    "by following the Gravity redirect server-side. Returns a direct signed S3 URL.",
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
      return response.headers.get("location")
    } catch {
      return null
    }
  },
}
