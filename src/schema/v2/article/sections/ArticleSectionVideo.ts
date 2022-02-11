import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ImageType } from "schema/v2/image"
import { ResolverContext } from "types/graphql"
import { extractEmbed } from "../lib/extractEmbed"

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
