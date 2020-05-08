import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLBoolean,
} from "graphql"
import { Gravity } from "types/runtime"
import { ResolverContext } from "types/graphql"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import { markdown } from "schema/v2/fields/markdown"
import { FeatureImageType } from "./FeatureImageType"

export const FeatureType = new GraphQLObjectType<
  Gravity.Feature,
  ResolverContext
>({
  name: "Feature",
  description: "A Feature",
  fields: () => ({
    ...SlugAndInternalIDFields,
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    isActive: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ active }) => active,
    },
    description: markdown(),
    image: {
      type: FeatureImageType,
      resolve: feature => {
        // If there is no available image return null here rather than down-tree (!)
        if (feature.image_versions.length === 0) return null
        return feature
      },
    },
  }),
})
