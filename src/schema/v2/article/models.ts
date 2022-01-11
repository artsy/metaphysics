import { ResolverContext } from "types/graphql"
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ImageType } from "../image"
import uuid from "uuid/v5"

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
    image: {
      type: ImageType,
      resolve: ({ url }) => {
        if (!url) return null

        // This... is the best we can do...
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
