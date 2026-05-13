import {
  hasImageVersion,
  hasMissingImageVersion,
  hasProcessingFailed,
  isProcessingImage,
} from "../imageHelper"

describe("imageHelper", () => {
  describe("hasImageVersion", () => {
    it("returns true when version exists in image_versions", () => {
      const image = { image_versions: ["square", "small", "normalized"] }
      expect(hasImageVersion(image, "normalized")).toBe(true)
    })

    it("returns false when version does not exist in image_versions", () => {
      const image = { image_versions: ["square", "small"] }
      expect(hasImageVersion(image, "normalized")).toBe(false)
    })

    it("returns false when image_versions is undefined", () => {
      const image = { image_versions: undefined }
      expect(hasImageVersion(image, "normalized")).toBe(false)
    })

    it("returns false when image_versions is null", () => {
      const image = { image_versions: null }
      expect(hasImageVersion(image, "normalized")).toBe(false)
    })

    it("returns false when image_versions is empty array", () => {
      const image = { image_versions: [] }
      expect(hasImageVersion(image, "normalized")).toBe(false)
    })
  })

  describe("hasMissingImageVersion", () => {
    it("returns false when all expected versions are present", () => {
      const image = {
        image_versions: [
          "square",
          "small",
          "medium",
          "larger",
          "large",
          "tall",
          "normalized",
          "main",
        ],
      }
      expect(hasMissingImageVersion(image)).toBe(false)
    })

    it("returns true when one version is missing", () => {
      const image = {
        image_versions: [
          "square",
          "small",
          "medium",
          "larger",
          "large",
          "tall",
          // missing "normalized"
        ],
      }
      expect(hasMissingImageVersion(image)).toBe(true)
    })

    it("returns true when multiple versions are missing", () => {
      const image = {
        image_versions: ["square", "small"],
      }
      expect(hasMissingImageVersion(image)).toBe(true)
    })

    it("returns true when image_versions is undefined", () => {
      const image = { image_versions: undefined }
      expect(hasMissingImageVersion(image)).toBe(true)
    })

    it("returns true when image_versions is null", () => {
      const image = { image_versions: null }
      expect(hasMissingImageVersion(image)).toBe(true)
    })

    it("returns true when image_versions is empty array", () => {
      const image = { image_versions: [] }
      expect(hasMissingImageVersion(image)).toBe(true)
    })
  })

  describe("isProcessingImage", () => {
    it("returns false when image has all expected versions", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: [
          "square",
          "small",
          "medium",
          "larger",
          "large",
          "tall",
          "normalized",
          "main",
        ],
        gemini_token_updated_at: new Date().toISOString(),
      }
      expect(isProcessingImage(image)).toBe(false)
    })

    it("returns true when missing versions and within grace period", () => {
      const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: recentTime,
      }
      expect(isProcessingImage(image)).toBe(true)
    })

    it("returns true when missing versions and just within grace period", () => {
      const justWithinGracePeriod = new Date(
        Date.now() - 29 * 60 * 1000
      ).toISOString() // 29 minutes ago
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: justWithinGracePeriod,
      }
      expect(isProcessingImage(image)).toBe(true)
    })

    it("returns false when missing versions but outside grace period", () => {
      const oldTime = new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: oldTime,
      }
      expect(isProcessingImage(image)).toBe(false)
    })

    it("returns false when gemini_token_updated_at is null", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: null,
      }
      expect(isProcessingImage(image)).toBe(false)
    })

    it("returns false when gemini_token_updated_at is undefined", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: undefined,
      }
      expect(isProcessingImage(image)).toBe(false)
    })

    it("returns false when gemini_token_updated_at is empty string", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: "",
      }
      expect(isProcessingImage(image)).toBe(false)
    })
  })

  describe("hasProcessingFailed", () => {
    it("returns false when image has normalized version", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: [
          "square",
          "small",
          "medium",
          "larger",
          "large",
          "tall",
          "normalized",
        ],
        gemini_token_updated_at: new Date().toISOString(),
      }
      expect(hasProcessingFailed(image)).toBe(false)
    })

    it("returns true when missing normalized version and not processing", () => {
      const oldTime = new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small", "medium"],
        gemini_token_updated_at: oldTime,
      }
      expect(hasProcessingFailed(image)).toBe(true)
    })

    it("returns false when missing normalized but still processing", () => {
      const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: recentTime,
      }
      expect(hasProcessingFailed(image)).toBe(false)
    })

    it("returns true when image has no versions at all", () => {
      const oldTime = new Date(Date.now() - 45 * 60 * 1000).toISOString()
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: [],
        gemini_token_updated_at: oldTime,
      }
      expect(hasProcessingFailed(image)).toBe(true)
    })

    it("returns true when image has some versions but not normalized and no gemini_token_updated_at", () => {
      const image = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token_updated_at: null,
      }
      // Without gemini_token_updated_at, it's not processing and missing normalized = failed
      expect(hasProcessingFailed(image)).toBe(true)
    })
  })

  describe("integration - state transitions", () => {
    it("handles fresh upload state correctly", () => {
      const freshImage = {
        image_url: "https://example.com/image.jpg",
        image_versions: [],
        gemini_token_updated_at: new Date().toISOString(),
      }

      expect(isProcessingImage(freshImage)).toBe(true)
      expect(hasProcessingFailed(freshImage)).toBe(false)
    })

    it("handles processing state correctly", () => {
      const recentTime = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const processingImage = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small", "medium"],
        gemini_token_updated_at: recentTime,
      }

      expect(isProcessingImage(processingImage)).toBe(true)
      expect(hasProcessingFailed(processingImage)).toBe(false)
    })

    it("handles success state correctly", () => {
      const successImage = {
        image_url: "https://example.com/image.jpg",
        image_versions: [
          "square",
          "small",
          "medium",
          "larger",
          "large",
          "tall",
          "normalized",
          "main",
        ],
        gemini_token_updated_at: new Date().toISOString(),
      }

      expect(isProcessingImage(successImage)).toBe(false)
      expect(hasProcessingFailed(successImage)).toBe(false)
    })

    it("handles failed state correctly", () => {
      const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      const failedImage = {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small", "medium"],
        gemini_token_updated_at: oldTime,
      }

      expect(isProcessingImage(failedImage)).toBe(false)
      expect(hasProcessingFailed(failedImage)).toBe(true)
    })

    it("handles missing original state correctly", () => {
      const missingImage = {
        image_url: null,
        image_versions: ["square", "small"],
        gemini_token_updated_at: new Date().toISOString(),
      }

      expect(isProcessingImage(missingImage)).toBe(true)
      expect(hasProcessingFailed(missingImage)).toBe(false)
    })
  })

  describe("with brand-kit-logo template", () => {
    const brandKitImage = { gemini_template_key: "brand-kit-logo" }

    it("treats a fresh upload (no versions, recent timestamp) as processing", () => {
      const freshImage = {
        ...brandKitImage,
        image_url: null,
        image_versions: [],
        gemini_token_updated_at: new Date().toISOString(),
      }

      expect(isProcessingImage(freshImage)).toBe(true)
      expect(hasProcessingFailed(freshImage)).toBe(false)
    })

    it("treats a fully processed logo (only square_brand_kit) as done — not still processing, not failed", () => {
      const successImage = {
        ...brandKitImage,
        image_url: "https://example.com/logo/:version.jpg",
        image_versions: ["square_brand_kit"],
        gemini_token_updated_at: new Date().toISOString(),
      }

      expect(isProcessingImage(successImage)).toBe(false)
      expect(hasProcessingFailed(successImage)).toBe(false)
    })

    it("treats a stuck upload (no versions, past grace period) as failed", () => {
      const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const failedImage = {
        ...brandKitImage,
        image_url: null,
        image_versions: [],
        gemini_token_updated_at: oldTime,
      }

      expect(isProcessingImage(failedImage)).toBe(false)
      expect(hasProcessingFailed(failedImage)).toBe(true)
    })

    it("does not require artwork versions to consider a brand-kit logo complete", () => {
      const image = {
        ...brandKitImage,
        image_versions: ["square_brand_kit"],
      }

      expect(hasMissingImageVersion(image)).toBe(false)
    })

    it("falls back to artwork expectations when gemini_template_key is absent", () => {
      const image = { image_versions: ["square_brand_kit"] }

      expect(hasMissingImageVersion(image)).toBe(true)
    })
  })
})
