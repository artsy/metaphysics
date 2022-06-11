import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { sortBy } from "lodash"
import { ResolverContext } from "types/graphql"
import { date } from "../fields/date"

export const FeatureFlagStrategyTypeEnum = {
  type: new GraphQLEnumType({
    name: "FeatureFlagStrategyType",
    values: {
      DEFAULT: {
        description: "Simple on/off flag",
        value: "default",
      },
      FLEXIBLE_ROLLOUT: {
        description:
          "For A/B tests, where you can specify a percentage of users to be served a variant",
        value: "flexibleRollout",
      },
    },
  }),
}

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
    createdAt: date(),
    strategies: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "FeatureFlagStrategies",
          fields: {
            strategy: FeatureFlagStrategyTypeEnum,
          },
        })
      ),
    },
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
    lastSeenAt: date(),
    project: {
      type: GraphQLString,
    },
  },
})

// Simple object because used as input type as well
export const FeatureFlagVariant = {
  name: "FeatureFlagVariant",
  fields: {
    name: {
      type: new GraphQLEnumType({
        name: "FeatureFlagVariantName",
        values: {
          CONTROL: {
            value: "control",
          },
          EXPERIMENT: {
            value: "experiment",
          },
        },
      }),
    },
    weightType: {
      type: new GraphQLEnumType({
        name: "FeatureFlagVariantWeightType",
        values: {
          VARIABLE: {
            value: "variable",
          },
        },
      }),
    },
    weight: {
      type: GraphQLInt,
    },
    stickiness: {
      type: GraphQLString,
      defaultValue: "sessionId",
    },
  },
}

export const FeatureFlags: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(FeatureFlagType),
  description: "A list of feature flags",
  args: {
    sortBy: {
      description: "The sort order of the results",
      defaultValue: "name",
      type: new GraphQLEnumType({
        name: "FeatureFlagsSortBy",
        values: {
          NAME: {
            value: "name",
          },
          CREATED_AT: {
            value: "createdAt",
          },
        },
      }),
    },
  },
  resolve: async (_root, args, { adminFeatureFlagsLoader }) => {
    if (!adminFeatureFlagsLoader) return null

    const { features } = await adminFeatureFlagsLoader()
    const sorted = sortBy(features, args.sortBy)
    return sorted
  },
}
