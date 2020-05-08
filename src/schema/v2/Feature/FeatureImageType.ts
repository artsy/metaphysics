import { GraphQLString, GraphQLObjectType, GraphQLInt } from "graphql"
import { Gravity } from "types/runtime"
import { ResolverContext } from "types/graphql"
import {
  FeatureImageVersionEnum,
  FeatureImageVersion,
  FEATURE_IMAGE_VERSIONS,
} from "./FeatureImageVersionEnum"

export const FeatureImageType = new GraphQLObjectType<
  Gravity.Feature,
  ResolverContext
>({
  name: "FeatureImage",
  fields: {
    width: {
      description: "Unscaled (original) image width",
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    height: {
      description: "Unscaled (original) image height",
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
    url: {
      type: GraphQLString,
      description:
        "Ask for a version and you might receive it. Versions are not guaranteed to be present.",
      args: {
        version: {
          type: FeatureImageVersionEnum,
          defaultValue: FEATURE_IMAGE_VERSIONS.SOURCE.value,
        },
      },
      resolve: ({ image_urls }, args) => {
        const { version } = args as { version: FeatureImageVersion }
        const url = image_urls[version.key as keyof typeof image_urls]
        return url
      },
    },
  },
})
