import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"

/**
 * A client-facing representation of an Unleash feature flag.
 */
export const UnleashFeatureFlag = new GraphQLObjectType<any, ResolverContext>({
  name: "UnleashFeatureFlag",
  description:
    "An Unleash feature toggle, used for managing releases, experiments, etc.",
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
          name: "UnleashExperimentVariant",
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
