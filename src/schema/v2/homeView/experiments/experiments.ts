import { FeatureFlag } from "lib/featureFlags"

/**
 * Provide here the names of the Unleash experiment feature flags that
 * should be exposed as part of the current home view response
 */
export const CURRENTLY_RUNNING_EXPERIMENTS: FeatureFlag[] = [
  "onyx_experiment_home_view_test",
  "onyx_nwfy-at-risk-gallery-boost-experiment",
]
