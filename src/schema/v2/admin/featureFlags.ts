import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const FeatureFlagsTypeEnum = {
  type: new GraphQLEnumType({
    name: "FeatureFlagsType",
    values: {
      EXPERIMENT: {
        value: "experiment",
      },
      RELEASE: {
        value: "release",
      },
    },
  }),
}

const FeatureFlagsVariantType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlagVariant",
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    stickiness: {
      type: GraphQLString,
    },
    weight: {
      type: GraphQLInt,
    },
    weightType: {
      type: GraphQLString,
    },
    // overrides: new GraphQLList({
    //   type: new GraphQLObjectType({
    //     name: "FeatureFlagOverrides",
    //   })
    // })
  }),
})

const FeatureFlagsType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlags",
  fields: {
    description: {
      type: GraphQLString,
    },
    type: FeatureFlagsTypeEnum,
    variants: {
      type: new GraphQLList(FeatureFlagsVariantType),
    },
    createdAt: {
      type: GraphQLString,
    },
    // strategies: {
    //   type: new GraphQLList(FeatureFlagsVariantType),
    // }
    enabled: {
      type: GraphQLBoolean,
    },
    name: {
      type: GraphQLString,
    },
    stale: {
      type: GraphQLBoolean,
    },
    impressionData: {
      type: GraphQLBoolean,
    },
    lastSeenAt: {
      type: GraphQLString,
    },
    project: {
      type: GraphQLString,
    },
  },
})

export const FeatureFlags: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(FeatureFlagsType),
  description: "A list of feature flags",
  resolve: async (_root, _args, { adminFeaturesLoader }) => {
    if (!adminFeaturesLoader) return null
    const { features } = await adminFeaturesLoader()
    return features
  },
}
