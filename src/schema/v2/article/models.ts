import { ResolverContext } from "types/graphql"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ImageType } from "../image"
import uuid from "uuid/v5"
import { extractEmbed, isEmbed } from "./lib/extractEmbed"
import { isMedia } from "./lib/isMedia"
import { SlugAndInternalIDFields } from "../object_identification"

const ArticleUnpublishedArtworkArtist = new GraphQLObjectType({
  name: "ArticleUnpublishedArtworkArtist",
  fields: {
    name: { type: GraphQLString },
    slug: { type: GraphQLString },
  },
})

export const ArticleUnpublishedArtwork = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleUnpublishedArtwork",
  fields: {
    ...SlugAndInternalIDFields,
    date: { type: GraphQLString },
    title: { type: GraphQLString },
    image: {
      type: ImageType,
      resolve: ({ image, width, height }) => {
        if (!image) return null

        // Return a Gravity-like image response
        return {
          original_width: width,
          original_height: height,
          image_url: image.replace("larger", ":version"),
          // We assume all these versions are available
          image_versions: ["normalized", "larger", "large"],
        }
      },
    },
    partner: {
      type: new GraphQLObjectType({
        name: "ArticleUnpublishedArtworkPartner",
        fields: {
          name: { type: GraphQLString },
          slug: { type: GraphQLString },
        },
      }),
    },
    artists: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArticleUnpublishedArtworkArtist))
      ),
    },
    artist: { type: ArticleUnpublishedArtworkArtist },
    credit: { type: GraphQLString },
  },
})

export const ArticleImageSection = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleImageSection",
  isTypeOf: ({ type }) => {
    return type === "image"
  },
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ url }) => {
        return uuid(url, uuid.URL)
      },
    },
    image: {
      type: ImageType,
      resolve: ({ url, width, height }) => {
        if (!url) return null

        // Return a Gravity-like image response
        return {
          original_width: width,
          original_height: height,
          image_url: url.replace("larger", ":version"),
          // We assume all these versions are available
          image_versions: ["normalized", "larger", "large"],
        }
      },
    },
    caption: { type: GraphQLString },
    layout: { type: GraphQLString },
  },
})

export const ArticleFeatureSection = new GraphQLObjectType({
  name: "ArticleFeatureSection",
  isTypeOf: ({ type }) => {
    return ["fullscreen", "split", "text", "basic"].includes(type)
  },
  fields: {
    title: { type: GraphQLString },
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
    media: {
      type: GraphQLString,
      resolve: ({ url }) => {
        if (!url || !isMedia(url)) return null
        return url
      },
    },
    image: {
      type: ImageType,
      resolve: ({ url }) => {
        if (!url) return null

        // Positron returns a single URL with no metadata
        // for images, embeds, and media
        if (isEmbed(url) || isMedia(url)) return null

        // We don't currently save image dimensions, unfortunately
        return {
          image_url: url,
        }
      },
    },
    layout: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "ArticleFeatureSectionType",
          values: {
            FULLSCREEN: { value: "fullscreen" },
            SPLIT: { value: "split" },
            TEXT: { value: "text" },
            BASIC: { value: "basic" },
          },
        })
      ),
      resolve: ({ type }) => {
        return type
      },
    },
  },
})

export const ArticleHero = new GraphQLUnionType({
  name: "ArticleHero",
  types: [ArticleFeatureSection],
})

export const ARTICLE_LAYOUTS = {
  CLASSIC: { value: "classic" },
  FEATURE: { value: "feature" },
  NEWS: { value: "news" },
  SERIES: { value: "series" },
  STANDARD: { value: "standard" },
  VIDEO: { value: "video" },
} as const

export type ArticleLayout = typeof ARTICLE_LAYOUTS[keyof typeof ARTICLE_LAYOUTS]["value"]

export const ArticleLayoutEnum = new GraphQLEnumType({
  name: "ArticleLayout",
  values: ARTICLE_LAYOUTS,
})
