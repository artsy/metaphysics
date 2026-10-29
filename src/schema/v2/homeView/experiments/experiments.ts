import { FeatureFlag } from "lib/featureFlags"
import { HOME_FEED_SIMPLIFICATION_FLAG } from "../mixer/rules/HomeFeedSimplificationRule"

/**
 * Provide here the names of the Unleash experiment feature flags that
 * should be exposed as part of the current home view response
 */
export const CURRENTLY_RUNNING_EXPERIMENTS: FeatureFlag[] = [
  HOME_FEED_SIMPLIFICATION_FLAG,
]
