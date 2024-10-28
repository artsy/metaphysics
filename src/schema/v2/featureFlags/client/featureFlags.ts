import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"

/**
 * A client-facing representation of an Unleash feature flag, exposed to client apps
 */
export const ClientFeatureFlagType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ClientFeatureFlag",
  description:
    "An client-facing feature flag, used for tracking releases, experiments, etc.",
  fields: {
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "The name of the feature",
    },
    enabled: {
      type: GraphQLNonNull(GraphQLString),
      description: "Whether the feature is enabled",
    },
    description: {
      type: GraphQLString,
      description: "A description of the feature",
    },
    variant: {
      type: GraphQLString,
      description:
        "The name of the experimental variant being shown currently (when the feature is of type `experiment`)",
    },
    variants: {
      description:
        "The variants available within this experiment (when the feature is of type `experiment`)",
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
          name: "ClientFeatureFlagVariant",
          fields: {
            name: {
              type: GraphQLNonNull(GraphQLString),
            },
            weight: {
              type: GraphQLNonNull(GraphQLInt),
            },
            stickiness: {
              type: GraphQLString,
            },
          },
        })
      ),
    },
  },
})
