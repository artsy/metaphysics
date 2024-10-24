import { GraphQLNonNull, GraphQLFieldConfig, GraphQLList } from "graphql"
import {
  FeatureFlag,
  getExperimentVariant,
  getFeatureFlag,
} from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { CURRENTLY_RUNNING_EXPERIMENTS } from "./experiments"
import { UnleashFeatureFlag } from "schema/v2/unleashFeatureFlag"
import { compact } from "lodash"

export const HomeViewExperiments: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLNonNull(GraphQLList(UnleashFeatureFlag)),
  description: "Currently running A/B tests for home view content",
  resolve: (_parent, _args, context, _info) => {
    const experiments = CURRENTLY_RUNNING_EXPERIMENTS.map(
      (name: FeatureFlag) => {
        const flag = getFeatureFlag(name)
        const variant = getExperimentVariant(name, { userId: context.userID })

        if (flag && flag.enabled) {
          return {
            ...flag,
            variant: variant ? variant.name : null,
          }
        }
      }
    )
    return compact(experiments)
  },
}
