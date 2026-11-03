import { GraphQLNonNull, GraphQLFieldConfig, GraphQLList } from "graphql"
import {
  FeatureFlag,
  getExperimentVariant,
  getFeatureFlag,
} from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { CURRENTLY_RUNNING_EXPERIMENTS } from "./experiments"
import {
  HOME_FEED_SIMPLIFICATION_FLAG,
  isEligibleForHomeFeedSimplification,
} from "../mixer/rules/HomeFeedSimplificationRule"
import { ClientFeatureFlagType } from "schema/v2/featureFlags/client/featureFlags"
import { compact } from "lodash"

export const HomeViewExperiments: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(ClientFeatureFlagType)),
  description: "Currently running A/B tests for home view content",
  resolve: (_parent, _args, context, _info) => {
    const experiments = CURRENTLY_RUNNING_EXPERIMENTS.map(
      (name: FeatureFlag) => {
        // Don't report the experiment as exposed for viewers the rule serves the
        // baseline to — same eligibility gate, so the two can't drift.
        if (
          name === HOME_FEED_SIMPLIFICATION_FLAG &&
          !isEligibleForHomeFeedSimplification(context)
        ) {
          return undefined
        }

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
