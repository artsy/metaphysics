import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
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
import { GlobalIDField } from "../object_identification"

export const FeatureFlagType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlag",
  fields: {
    id: GlobalIDField,
    description: {
      type: GraphQLString,
    },
    environments: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "FeatureFlagEnvironments",
          fields: {
            name: {
              type: new GraphQLNonNull(GraphQLString),
            },
            enabled: {
              type: new GraphQLNonNull(GraphQLBoolean),
            },
          },
        })
      ),
    },
    type: {
      type: new GraphQLNonNull(GraphQLString),
    },
    variants: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLObjectType<any, ResolverContext>({
              name: "FeatureFlagVariantType",
              fields: {
                name: {
                  type: new GraphQLNonNull(GraphQLString),
                },
                weightType: {
                  type: GraphQLString,
                },
                weight: {
                  type: new GraphQLNonNull(GraphQLInt),
                },
                stickiness: {
                  type: GraphQLString,
                },
              },
            })
          )
        )
      ),
    },
    createdAt: date(),
    enabled: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    stale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    impressionData: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    lastSeenAt: date(),
    project: {
      type: new GraphQLNonNull(GraphQLString),
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

    const sorted = merge(
      sort(featureFlags.features),
      sort(project.features)
    ).map((item: any) => ({
      ...item,
      id: base64(item.name), // Add id for relay cache support
    }))

    return sorted
  },
}
