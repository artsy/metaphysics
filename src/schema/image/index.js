import { find, first, isArray } from "lodash"
import VersionedUrl from "./versioned"
import CroppedUrl from "./cropped"
import ResizedUrl from "./resized"
import DeepZoom, { isZoomable } from "./deep_zoom"
import normalize from "./normalize"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
} from "graphql"

export const getDefault = images => {
  if (isArray(images)) {
    return find(images, { is_default: true }) || first(images)
  }
  return images
}

const ImageType = new GraphQLObjectType({
  name: "Image",
  fields: () => ({
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
    id: {
      description: "A type-specific ID.",
      type: GraphQLString,
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

export default {
  type: ImageType,
  resolve: normalize,
}
