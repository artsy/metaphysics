import {
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { find, first, isArray } from "lodash"
import { ResolverContext } from "types/graphql"
import CroppedUrl from "./cropped"
import DeepZoom, { isZoomable } from "./deep_zoom"
import { ImageData, normalize } from "./normalize"
import ResizedUrl from "./resized"
import VersionedUrl from "./versioned"
import { NullableIDField } from "schema/v1/object_identification"

export { normalize as normalizeImageData } from "./normalize"

export const getDefault = (images) => {
  if (isArray(images)) {
    return find(images, { is_default: true } as any) || first(images)
  }
  return images
}

const ImageType = new GraphQLObjectType<any, ResolverContext>({
  name: "Image",
  fields: (): any => ({
    ...NullableIDField,
    aspect_ratio: {
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ aspect_ratio }) => {
        return aspect_ratio || 1
      },
    },
    caption: {
      type: GraphQLString,
    },
    cropped: CroppedUrl,
    deep_zoom: DeepZoom,
    href: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    image_url: {
      type: GraphQLString,
    },
    image_versions: {
      type: new GraphQLList(GraphQLString),
    },
    is_default: {
      type: GraphQLBoolean,
    },
    is_zoomable: {
      type: GraphQLBoolean,
      resolve: isZoomable,
    },
    max_tiled_height: {
      type: GraphQLInt,
    },
    max_tiled_width: {
      type: GraphQLInt,
    },
    original_height: {
      type: GraphQLInt,
    },
    original_width: {
      type: GraphQLInt,
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
      resolve: ({ original_height, original_width }) =>
        `${(original_height / original_width) * 100}%`,
    },
    position: {
      type: GraphQLInt,
    },
    resized: ResizedUrl,
    tile_base_url: {
      type: GraphQLString,
    },
    tile_format: {
      type: GraphQLString,
    },
    tile_size: {
      type: GraphQLInt,
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
  resolve: normalize,
}

export default Image
