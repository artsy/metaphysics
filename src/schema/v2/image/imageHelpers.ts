// Expected image versions for processing validation
export const EXPECTED_IMAGE_VERSIONS = [
  "square",
  "small",
  "medium",
  "medium_rectangle",
  "larger",
  "large",
  "large_rectangle",
  "tall",
  "normalized",
]

// Grace period for image processing (30 minutes in milliseconds)
export const GRACE_PERIOD_FOR_PROCESSING = 30 * 60 * 1000

// Helper function to check if original is missing
export const isMissingOriginal = (image) => {
  return !image.image_url
}

// Helper function to check if image has a specific version
export const hasImageVersion = (image, version: string) => {
  return image.image_versions?.includes(version)
}

// Helper function to check if any expected image version is missing
export const hasMissingImageVersion = (image) => {
  if (!image.image_versions) return true
  return EXPECTED_IMAGE_VERSIONS.some(
    (version) => !image.image_versions.includes(version)
  )
}

// Check if image is currently processing
export const isProcessingImage = (image) => {
  const geminiTokenUpdatedAt = image.gemini_token_updated_at

  // Return false if missing original or no gemini token update timestamp
  if (isMissingOriginal(image) || !geminiTokenUpdatedAt) {
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
