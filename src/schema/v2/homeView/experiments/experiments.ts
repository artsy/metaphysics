import { FeatureFlag } from "lib/featureFlags"

/**
 * Provide here the names of the Unleash experiment feature flags that
 * should be exposed as part of the current home view response
 */
export const CURRENTLY_RUNNING_EXPERIMENTS: FeatureFlag[] = [
  "onyx_nwfy-price-reranking-test",
]
