import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import {
  FeatureFlag,
  getExperimentVariant,
  getFeatureFlag,
} from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { CURRENTLY_RUNNING_EXPERIMENTS } from "./experiments"

const HomeViewExperiment = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeViewExperiment",
  description: "An A/B test for home view content",
  fields: {
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "The name of the experiment",
    },
    enabled: {
      type: GraphQLNonNull(GraphQLString),
      description: "Whether the experiment is enabled",
    },
    service: {
      type: GraphQLNonNull(GraphQLString),
    },
    description: {
      type: GraphQLString,
      description: "A description of the experiment",
    },
    variant: {
      type: GraphQLString,
      description: "The name of the experimental variant being shown currently",
    },
    variants: {
      description: "The variants available within this experiment",
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
          name: "HomeViewExperimentVariant",
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

export const HomeViewExperiments: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLNonNull(GraphQLList(HomeViewExperiment)),
  description: "Currently running A/B tests for home view content",
  resolve: (_parent, _args, context, _info) => {
    const experiments = CURRENTLY_RUNNING_EXPERIMENTS.map(
      (name: FeatureFlag) => {
        const flag = getFeatureFlag(name)
        const variant = getExperimentVariant(name, { userId: context.userID })

        return {
          ...flag,
          service: "unleash",
          variant: variant ? variant.name : null,
        }
      }
    )
    return experiments
  },
}
