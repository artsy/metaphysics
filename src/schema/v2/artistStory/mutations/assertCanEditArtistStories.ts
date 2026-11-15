import config from "config"
import { isFeatureFlagEnabled } from "lib/featureFlags"

export const canEditArtistStories = (userId: string | undefined) => {
  // Read per call so tests can toggle it.
  const isDevelopment = config.NODE_ENV === "development"

  if (
    !isDevelopment &&
    !isFeatureFlagEnabled("fireworksq4_edit-artist-story", { userId })
  ) {
    throw new Error("This feature is not currently enabled")
  }
}
