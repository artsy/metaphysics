/**
 * Expected image versions per Gemini template, used to detect processing state.
 *
 * Generate from the Gemini console with:
 *   Account.find_by(name: "Gravity").templates.find_by(key: "<template-key>").versions.map(&:key).sort
 */
export const EXPECTED_IMAGE_VERSIONS_BY_TEMPLATE = {
  "additional-image": [
    "large",
    "larger",
    "main",
    "medium",
    "normalized",
    "small",
    "square",
    "tall",
  ],
  "brand-kit-logo": ["logo_brand_kit"],
} as const

// The last version Gemini emits per template — its presence signals processing is complete.
export const COMPLETION_VERSION_BY_TEMPLATE = {
  "additional-image": "normalized",
  "brand-kit-logo": "logo_brand_kit",
} as const

type TemplateKey = keyof typeof EXPECTED_IMAGE_VERSIONS_BY_TEMPLATE
const DEFAULT_TEMPLATE: TemplateKey = "additional-image"

const isKnownTemplate = (k: unknown): k is TemplateKey =>
  typeof k === "string" && k in EXPECTED_IMAGE_VERSIONS_BY_TEMPLATE

const getTemplate = (image): TemplateKey =>
  isKnownTemplate(image.gemini_template_key)
    ? image.gemini_template_key
    : DEFAULT_TEMPLATE

// Grace period for image processing (30 minutes in milliseconds)
export const GRACE_PERIOD_FOR_PROCESSING = 30 * 60 * 1000

// Helper function to check if image has a specific version
export const hasImageVersion = (image, version: string) => {
  return !!image.image_versions?.includes(version)
}

// Helper function to check if any expected image version is missing
export const hasMissingImageVersion = (image) => {
  if (!image.image_versions) return true
  const expected = EXPECTED_IMAGE_VERSIONS_BY_TEMPLATE[getTemplate(image)]
  return expected.some((version) => !image.image_versions.includes(version))
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

  return !hasImageVersion(
    image,
    COMPLETION_VERSION_BY_TEMPLATE[getTemplate(image)]
  )
}
