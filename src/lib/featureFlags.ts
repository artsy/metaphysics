import config from "config"
import { Context as UnleashContext, Unleash, initialize } from "unleash-client"
import { info, error } from "./loggers"

const { UNLEASH_API, UNLEASH_APP_NAME, UNLEASH_SERVER_KEY } = config

/**
 * Feature flags are defined within Unleash.
 * @see https://tools.artsy.net/feature-flags
 */
const FEATURE_FLAGS_LIST = ["diamond_blurhash-enabled-globally"] as const

type FeatureFlag = typeof FEATURE_FLAGS_LIST[number]

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
