import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ImageType } from "schema/v2/image"
import { ResolverContext } from "types/graphql"
import { extractEmbed } from "../lib/extractEmbed"

const DEFAULT_ASPECT_RATIO = 16 / 9

export const ArticleSectionVideo = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleSectionVideo",
  isTypeOf: (section) => {
    return section.type === "video"
  },
  fields: () => ({
    url: {
      type: new GraphQLNonNull(GraphQLString),
    },
    caption: {
      type: GraphQLString,
    },
    image: {
      type: ImageType,
      resolve: ({ cover_image_url }) => {
        if (!cover_image_url) return null

        // We don't currently save image dimensions, unfortunately
        return {
          image_url: cover_image_url,
        }
      },
    },
    layout: {
      type: new GraphQLEnumType({
        name: "ArticleSectionVideoLayout",
        values: {
          COLUMN_WIDTH: { value: "column_width" },
          OVERFLOW_FILLWIDTH: { value: "overflow_fillwidth" },
          FILLWIDTH: { value: "fillwidth" },
        },
      }),
    },
    aspectRatio: {
      description:
        "Width divided by height (e.g. 0.5625 for a 9:16 portrait video). Defaults to 16:9.",
      type: new GraphQLNonNull(GraphQLFloat),
      resolve: ({ aspect_ratio }) => {
        const ratio = Number(aspect_ratio)
        return aspect_ratio && ratio > 0 ? ratio : DEFAULT_ASPECT_RATIO
      },
    },
    backgroundColor: {
      type: GraphQLString,
      resolve: ({ background_color }) => background_color,
    },
    embed: {
      description: "Only YouTube and Vimeo are supported",
      args: {
        autoPlay: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
      },
      type: GraphQLString,
      resolve: ({ url }, { autoPlay }) => {
        if (!url) return null
        const options = { autoplay: autoPlay ? 1 : 0 }
        return extractEmbed(url, options)
      },
    },
  }),
})
