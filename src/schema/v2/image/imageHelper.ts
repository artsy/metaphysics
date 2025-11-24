/**
 * Expected artwork image versions for processing validation.
 *
 * Generate from Gemini console with:
 * Account.find_by(name: "Gravity").templates.find_by(key: "additional-image").versions.map(&:key).sort
 */
export const EXPECTED_ARTWORK_IMAGE_VERSIONS = [
  "large",
  "larger",
  "main",
  "medium",
  "normalized",
  "small",
  "square",
  "tall",
]

// Grace period for image processing (30 minutes in milliseconds)
export const GRACE_PERIOD_FOR_PROCESSING = 30 * 60 * 1000

// Helper function to check if image has a specific version
export const hasImageVersion = (image, version: string) => {
  return !!image.image_versions?.includes(version)
}

// Helper function to check if any expected image version is missing
export const hasMissingImageVersion = (image) => {
  if (!image.image_versions) return true
  return EXPECTED_ARTWORK_IMAGE_VERSIONS.some(
    (version) => !image.image_versions.includes(version)
  )
}

// Check if image is currently processing
export const isProcessingImage = (image) => {
  const geminiTokenUpdatedAt = image.gemini_token_updated_at

  // Return false no gemini token update timestamp
  if (!image.gemini_token_updated_at) {
    return false
  }

  // Check if within grace period and missing versions
  const updatedAtTime = new Date(geminiTokenUpdatedAt).getTime()
  const now = Date.now()
  const withinGracePeriod = updatedAtTime + GRACE_PERIOD_FOR_PROCESSING > now

  return withinGracePeriod && hasMissingImageVersion(image)
}

// Check if image processing has failed
export const hasProcessingFailed = (image) => {
  // Processing is not failed if image is missing original or still processing
  if (isProcessingImage(image)) {
    return false
  }

  // Normalized is the last generated version and indicates that the image is processed
  return !hasImageVersion(image, "normalized")
}
