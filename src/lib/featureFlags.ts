import config from "config"
import { Unleash, Context as UnleashContext, initialize } from "unleash-client"
import { error, info } from "./loggers"

const { UNLEASH_API, UNLEASH_APP_NAME, UNLEASH_SERVER_KEY } = config

/**
 * Feature flags are defined within Unleash.
 * @see https://tools.artsy.net/feature-flags
 */
const FEATURE_FLAGS_LIST = [
  "onyx_enable-home-view-section-featured-fairs",
  "onyx_experiment_home_view_test",
  "emerald_clientside-collector-signals",
  "onyx_enable-home-view-mixer",
  "onyx_enable-quick-links-v2",
  "onyx_enable-home-view-auction-segmentation",
  "onyx_enable-quick-links-price-budget",
  "onyx_nwfy-price-affinity-test",
  "onyx_based_on_your_saves_home_view_section",
] as const

export type FeatureFlag = typeof FEATURE_FLAGS_LIST[number]

let unleashClient: Unleash

export function initializeFeatureFlags() {
  unleashClient = initialize({
    url: UNLEASH_API,
    appName: UNLEASH_APP_NAME,
    customHeaders: { Authorization: UNLEASH_SERVER_KEY },
  })

  unleashClient.on("error", () => {
    info("[featureFlags] Error initializing Unleash:", error)
  })

  unleashClient.on("synchronized", () => {
    info("[featureFlags] Unleash client initialized.")
  })
}

export function isFeatureFlagEnabled(
  flag: FeatureFlag,
  context: UnleashContext = {}
) {
  if (!unleashClient) {
    error(
      `[featureFlags] Error retrieving ${flag} feature flag. Unleash client not initialized.`
    )

    return false
  }

  return unleashClient.isEnabled(flag, context)
}

export function getFeatureFlag(flag: FeatureFlag) {
  if (!unleashClient) {
    error(
      `[featureFlags] Error retrieving ${flag} feature flag. Unleash client not initialized.`
    )
    return false
  }

  return unleashClient.getFeatureToggleDefinition(flag)
}

export function getExperimentVariant(
  flag: FeatureFlag,
  context: UnleashContext = {}
) {
  if (!unleashClient) {
    error(
      `[featureFlags] Error retrieving ${flag} feature flag. Unleash client not initialized.`
    )
    return false
  }

  return unleashClient.getVariant(flag, context)
}
