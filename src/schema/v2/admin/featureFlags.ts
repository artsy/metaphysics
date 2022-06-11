import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { merge, sortBy } from "lodash"
import { ResolverContext } from "types/graphql"
import { date } from "../fields/date"
import { base64 } from "lib/base64"

export const FeatureFlagType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlag",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (data) => {
        return base64(data.name)
      },
    },
    description: {
      type: GraphQLString,
    },
    environments: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "FeatureFlagEnvironments",
          fields: {
            name: {
              type: GraphQLString,
            },
            displayName: {
              type: GraphQLString,
            },
            enabled: {
              type: GraphQLBoolean,
            },
          },
        })
      ),
    },
    type: {
      type: GraphQLString,
    },
    variants: {
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
          name: "FeatureFlagVariantType",
          fields: {
            name: {
              type: GraphQLString,
            },
            weightType: {
              type: GraphQLString,
            },
            weight: {
              type: GraphQLInt,
            },
            stickiness: {
              type: GraphQLString,
            },
          },
        })
      ),
    },
    createdAt: date(),
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
  resolve: async (
    _root,
    args,
    { adminFeatureFlagsLoader, adminProjectLoader }
  ) => {
    if (!(adminFeatureFlagsLoader && adminProjectLoader)) {
      return null
    }

    // Need to load project data because feature flags endpoint lacks
    // `environment` field and so we merge the two together.
    const [featureFlags, project] = await Promise.all([
      adminFeatureFlagsLoader(),
      adminProjectLoader("default"),
    ])

    const sort = (data) => sortBy(data, args.sortBy)
    const sorted = merge(sort(featureFlags.features), sort(project.features))
    return sorted
  },
}
