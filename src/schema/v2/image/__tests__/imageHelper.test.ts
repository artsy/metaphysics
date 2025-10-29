import {
  hasImageVersion,
  hasMissingImageVersion,
  hasProcessingFailed,
  isMissingOriginal,
  isProcessingImage,
} from "../imageHelper"

describe("imageHelper", () => {
  describe("isMissingOriginal", () => {
    it("returns true when image_url is null", () => {
      const image = { image_url: null }
      expect(isMissingOriginal(image)).toBe(true)
    })

    it("returns true when image_url is undefined", () => {
      const image = { image_url: undefined }
      expect(isMissingOriginal(image)).toBe(true)
    })

    it("returns true when image_url is empty string", () => {
      const image = { image_url: "" }
      expect(isMissingOriginal(image)).toBe(true)
    })

    it("returns false when image_url is present", () => {
      const image = { image_url: "https://example.com/image.jpg" }
      expect(isMissingOriginal(image)).toBe(false)
    })
  })

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
          "medium_rectangle",
          "larger",
          "large",
          "large_rectangle",
          "tall",
          "normalized",
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
          "medium_rectangle",
          "larger",
          "large",
          "large_rectangle",
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
          "medium_rectangle",
          "larger",
          "large",
          "large_rectangle",
          "tall",
          "normalized",
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

    it("returns false when image_url is missing", () => {
      const image = {
        image_url: null,
        image_versions: ["square", "small"],
        gemini_token_updated_at: new Date().toISOString(),
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
          "medium_rectangle",
          "larger",
          "large",
          "large_rectangle",
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
          "medium_rectangle",
          "larger",
          "large",
          "large_rectangle",
          "tall",
          "normalized",
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

      expect(isProcessingImage(missingImage)).toBe(false)
      expect(hasProcessingFailed(missingImage)).toBe(true)
    })
  })
})
