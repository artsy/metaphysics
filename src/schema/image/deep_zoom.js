import { isExisty } from "lib/helpers"

import { GraphQLObjectType, GraphQLString, GraphQLInt } from "graphql"

export function isZoomable(image) {
  return (
    isExisty(image.tile_base_url) &&
    isExisty(image.tile_size) &&
    isExisty(image.tile_overlap) &&
    isExisty(image.tile_format) &&
    isExisty(image.max_tiled_height) &&
    isExisty(image.max_tiled_width)
  )
}

const DeepZoomType = new GraphQLObjectType({
  name: "DeepZoom",
  fields: {
    Image: {
      resolve: image => {return image},
      type: new GraphQLObjectType({
        name: "DeepZoomImage",
        fields: {
          Format: {
            type: GraphQLString,
            resolve: ({ tile_format }) => {return tile_format},
          },
          Overlap: {
            type: GraphQLInt,
            resolve: ({ tile_overlap }) => {return tile_overlap},
          },
          Size: {
            resolve: image => {return image},
            type: new GraphQLObjectType({
              name: "DeepZoomImageSize",
              fields: {
                Width: {
                  type: GraphQLInt,
                  resolve: ({ max_tiled_width }) => {return max_tiled_width},
                },
                Height: {
                  type: GraphQLInt,
                  resolve: ({ max_tiled_height }) => {return max_tiled_height},
                },
              },
            }),
          },
          TileSize: {
            type: GraphQLInt,
            resolve: ({ tile_size }) => {return tile_size},
          },
          Url: {
            type: GraphQLString,
            resolve: ({ tile_base_url }) =>
              {return tile_base_url
                // Ensure trailing slash
                .replace(/\/?$/, "/")},
          },
          xmlns: {
            type: GraphQLString,
            resolve: () => {return "http://schemas.microsoft.com/deepzoom/2008"},
          },
        },
      }),
    },
  },
})

export default {
  type: DeepZoomType,
  resolve: image => {return (isZoomable(image) ? image : null)},
}
