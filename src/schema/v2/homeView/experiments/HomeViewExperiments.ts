import { GraphQLNonNull, GraphQLFieldConfig, GraphQLList } from "graphql"
import {
  FeatureFlag,
  getExperimentVariant,
  getFeatureFlag,
} from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { CURRENTLY_RUNNING_EXPERIMENTS } from "./experiments"
import { HOME_FEED_SIMPLIFICATION_FLAG } from "../mixer/rules/HomeFeedSimplificationRule"
import { HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION } from "../sectionTypes/groupMinimumEigenVersion"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { ClientFeatureFlagType } from "schema/v2/featureFlags/client/featureFlags"
import { compact } from "lodash"

export const HomeViewExperiments: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(ClientFeatureFlagType)),
  description: "Currently running A/B tests for home view content",
  resolve: (_parent, _args, context, _info) => {
    const eigenVersion = getEigenVersionNumber(context.userAgent as string)

    const experiments = CURRENTLY_RUNNING_EXPERIMENTS.map(
      (name: FeatureFlag) => {
        // Don't report the home-feed experiment as exposed on clients too old to
        // render it — they fall back to baseline, so counting them skews the A/B.
        if (
          name === HOME_FEED_SIMPLIFICATION_FLAG &&
          eigenVersion &&
          !isAtLeastVersion(
            eigenVersion,
            HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION
          )
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
