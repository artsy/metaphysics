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
    lastSeenAt: date(),
    project: {
      type: GraphQLString,
    },
  },
})

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
