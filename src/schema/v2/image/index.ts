import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { find, first, isArray } from "lodash"
import { NullableIDField } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import CroppedUrl from "./cropped"
import DeepZoom, { isZoomable } from "./deep_zoom"
import { ImageData, normalize } from "./normalize"
import ResizedUrl from "./resized"
import VersionedUrl from "./versioned"
import { decode as decodeBlurHash } from "blurhash"
import UPNG from "upng-js"
import { encode } from "base64-arraybuffer"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { connectionWithCursorInfo } from "../fields/pagination"

export type OriginalImage = {
  original_width?: number
  original_height?: number
  image_url?: string
  image_urls?: string[]
  image_versions?: string[]
}

export { normalize as normalizeImageData } from "./normalize"

export const getDefault = (images, includeAll = false) => {
  if (isArray(images)) {
    // filter out broken images that don't have a URL
    const filteredImages = includeAll
      ? images
      : images.filter((image) => image.image_url)

    return (
      find(
        filteredImages,
        (img) => img.is_default === true || img.default === true
      ) || first(filteredImages)
    )
  }
  return images
}

export const ImageType = new GraphQLObjectType<any, ResolverContext>({
  name: "Image",
  fields: (): any => ({
    ...NullableIDField,
    aspectRatio: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ aspect_ratio }) => {
        return aspect_ratio || 1
      },
    },
    blurhash: {
      type: GraphQLString,
      description: "Blurhash code for the image",
    },
    blurhashDataURL: {
      type: GraphQLString,
      args: {
        width: {
          type: GraphQLInt,
          defaultValue: 64,
        },
      },
      resolve: ({ blurhash, aspect_ratio }, { width }, { userAgent }) => {
        const isEigen = userAgent?.match("Artsy-Mobile") != null

        const isBlurhashEnabled =
          isEigen || isFeatureFlagEnabled("diamond_blurhash-enabled-globally")

        if (!isBlurhashEnabled) return null
        if (!blurhash) return null

        try {
          const aspectRatio = aspect_ratio || 1
          const height = Math.round(width / aspectRatio)
          const pixels = decodeBlurHash(blurhash, width, height)
          const png = UPNG.encode([pixels], width, height, 256)

          return `data:image/png;base64,${encode(png)}`
        } catch (error) {
          console.error("[schema/v2/image/blurhashDataURI] Error:", error)
          return null
        }
      },
    },
    caption: {
      type: GraphQLString,
    },
    cropped: CroppedUrl,
    deepZoom: DeepZoom,
    href: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => image_url,
    },
    imageVersions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ image_versions }) => image_versions,
    },
    isDefault: {
      type: GraphQLBoolean,
      resolve: (image) => image.is_default || image.default,
    },
    isZoomable: {
      type: GraphQLBoolean,
      resolve: isZoomable,
    },
    maxTiledHeight: {
      type: GraphQLInt,
      resolve: ({ max_tiled_height }) => max_tiled_height,
    },
    maxTiledWidth: {
      type: GraphQLInt,
      resolve: ({ max_tiled_width }) => max_tiled_width,
    },
    originalHeight: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    originalWidth: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    orientation: {
      type: GraphQLString,
      resolve: ({ original_height, original_width }) => {
        if (original_width === original_height) return "square"
        return original_width > original_height ? "landscape" : "portrait"
      },
    },
    placeholder: {
      type: GraphQLString,
      description:
        "Value to use when `padding-bottom` for fluid image placeholders",
      resolve: ({ original_height, original_width }) => {
        // To avoid returning "NaN%" if original_width and original_height are 0.
        // The image is a square by default (when there is no image geometry).
        if (original_width === original_height) return "100%"

        return `${(original_height / original_width) * 100}%`
      },
    },
    position: {
      type: GraphQLInt,
      description:
        "Order position of the image, within the images array of the artwork. (1-indexed)",
    },
    resized: ResizedUrl,
    tileBaseURL: {
      type: GraphQLString,
      resolve: ({ tile_base_url }) => tile_base_url,
    },
    tileFormat: {
      type: GraphQLString,
      resolve: ({ tile_format }) => tile_format,
    },
    tileSize: {
      type: GraphQLInt,
      resolve: ({ tile_size }) => tile_size,
    },
    title: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    url: VersionedUrl,
    versions: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ image_versions }) => image_versions,
    },
  }),
})

const Image: GraphQLFieldConfig<ImageData, ResolverContext> = {
  type: ImageType,
  resolve: (parent, _args, { imageData }) => {
    const resolvedData = imageData || parent
    return normalize(resolvedData)
  },
}

export const ImageConnectionType = connectionWithCursorInfo({
  name: "Image",
  nodeType: ImageType,
}).connectionType

export default Image
