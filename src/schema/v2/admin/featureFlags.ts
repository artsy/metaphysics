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

export const FeatureFlagType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlags",
  fields: {
    description: {
      type: GraphQLString,
    },
    type: {
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
    },
    variants: {
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
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
      ),
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
  type: new GraphQLList(FeatureFlagType),
  description: "A list of feature flags",
  resolve: async (_root, _args, { adminFeatureFlagsLoader }) => {
    if (!adminFeatureFlagsLoader) return null

    const { features } = await adminFeatureFlagsLoader()
    return features
  },
}
