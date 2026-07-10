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
import GraphQLJSON from "graphql-type-json"
import { merge, sortBy } from "lodash"
import { ResolverContext } from "types/graphql"
import { date } from "../../fields/date"
import { base64 } from "lib/base64"
import { GlobalIDField } from "../../object_identification"

const FeatureFlagConstraintType = new GraphQLObjectType({
  name: "FeatureFlagConstraint",
  fields: {
    contextName: {
      type: GraphQLString,
    },
    operator: {
      type: GraphQLString,
    },
    values: {
      type: new GraphQLList(GraphQLString),
    },
    value: {
      type: GraphQLString,
    },
    inverted: {
      type: GraphQLBoolean,
    },
    caseInsensitive: {
      type: GraphQLBoolean,
    },
  },
})

const FeatureFlagSegmentType = new GraphQLObjectType({
  name: "FeatureFlagSegment",
  fields: {
    id: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    constraints: {
      type: new GraphQLList(FeatureFlagConstraintType),
    },
  },
})

const FeatureFlagStrategyType = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureFlagStrategy",
  fields: {
    name: {
      type: GraphQLString,
    },
    constraints: {
      type: new GraphQLList(FeatureFlagConstraintType),
    },
    parameters: {
      type: GraphQLJSON,
    },
    segments: {
      description:
        "Constraints applied to this strategy via a reusable, named Unleash segment (as opposed to inline constraints)",
      type: new GraphQLList(FeatureFlagSegmentType),
      resolve: async (
        { segments: segmentIDs },
        _args,
        { adminSegmentsLoader }
      ) => {
        if (!adminSegmentsLoader || !segmentIDs?.length) {
          return []
        }

        const { segments } = await adminSegmentsLoader()

        return segments.filter((segment) => segmentIDs.includes(segment.id))
      },
    },
  },
})

/**
 * An admin representation of an Unleash feature flag, used by Forque
 */
export const AdminFeatureFlagType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "FeatureFlag",
    description:
      "An admin-facing feature flag, used for managing releases, experiments, etc.",
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
              strategies: {
                type: new GraphQLList(FeatureFlagStrategyType),
              },
            },
          })
        ),
      },
      type: {
        type: new GraphQLNonNull(GraphQLString),
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
  }
)

const FeatureFlagEnums = new GraphQLEnumType({
  name: "FeatureFlagsSortBy",
  values: {
    NAME: {
      value: "name",
    },
    CREATED_AT: {
      value: "createdAt",
    },
  },
})

export const FeatureFlags: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(AdminFeatureFlagType),
  description: "A list of feature flags",
  args: {
    sortBy: {
      description: "The sort order of the results",
      defaultValue: FeatureFlagEnums.getValue("NAME")?.value,
      type: FeatureFlagEnums,
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
