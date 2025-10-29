/* eslint-disable promise/always-return */
import { assign } from "lodash"
import { getDefault } from "schema/v2/image"

import { runQuery } from "schema/v2/test/utils"

describe("getDefault", () => {
  it("returns the default image", () => {
    expect(
      getDefault([
        { id: "foo", image_url: "a-url", is_default: false },
        { id: "bar", image_url: "a-url", is_default: true },
        { id: "baz", image_url: "a-url", is_default: false },
      ]).id
    ).toBe("bar")
  })

  it("returns the first object if there is no default", () => {
    expect(
      getDefault([
        { id: "foo", image_url: "a-url" },
        { id: "bar", image_url: "a-url" },
        { id: "baz", image_url: "a-url" },
      ]).id
    ).toBe("foo")
  })

  it("filters out broken images without a URL", () => {
    expect(
      getDefault([
        { id: "foo", image_url: "a-url", is_default: false },
        { id: "bar", is_default: true },
        { id: "baz", image_url: "a-url", is_default: false },
      ]).id
    ).toBe("foo")
  })
})

describe("Image type", () => {
  const image = {
    image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
    image_versions: ["icon", "large"],
    image_urls: {
      icon: "https://xxx.cloudfront.net/xxx/icon.png",
      large: "https://xxx.cloudfront.net/xxx/large.jpg",
    },
  }

  let artwork = null
  let context = null

  beforeEach(() => {
    artwork = {
      id: "richard-prince-untitled-portrait",
      title: "untitled-portrait",
      artists: [],
      images: [image],
    }
    context = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
    }
  })

  describe("#aspect_ratio", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          aspectRatio
        }
      }
    }`

    it("returns original aspect_ratio when available", () => {
      assign(image, { aspect_ratio: 1.5 })
      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.aspectRatio).toBe(1.5)
      })
    })

    it("defaults to 1 when original aspect ratio is not available", () => {
      assign(image, { aspect_ratio: null })
      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.aspectRatio).toBe(1)
      })
    })
  })

  describe("#placeholder", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          placeholder
        }
      }
    }`

    it("is square by default (when there is no image geometry)", () => {
      assign(image, { original_width: null, original_height: null })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.placeholder).toBe("100%")
      })
    })
  })

  describe("#orientation", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          orientation
        }
      }
    }`

    it("is square by default (when there is no image geometry)", () => {
      assign(image, { original_width: null, original_height: null })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.orientation).toBe("square")
      })
    })

    it("detects portrait", () => {
      assign(image, { original_width: 1000, original_height: 1500 })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.orientation).toBe("portrait")
      })
    })

    it("detects landscape", () => {
      assign(image, { original_width: 2000, original_height: 1500 })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.orientation).toBe("landscape")
      })
    })

    it("detects square", () => {
      assign(image, { original_width: 2000, original_height: 2000 })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.orientation).toBe("square")
      })
    })
  })

  describe("#isProcessing", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          isProcessing
        }
      }
    }`

    it("returns false when image has all expected versions", () => {
      assign(image, {
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
        gemini_token: "token123",
        gemini_token_updated_at: new Date().toISOString(),
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
      })
    })

    it("returns true when image is missing versions and within grace period", () => {
      const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"], // Missing most versions
        gemini_token: "token123",
        gemini_token_updated_at: recentTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(true)
      })
    })

    it("returns false when image is missing versions but outside grace period", () => {
      const oldTime = new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"], // Missing most versions
        gemini_token: "token123",
        gemini_token_updated_at: oldTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
      })
    })

    it("returns false when image_url is missing", () => {
      assign(image, {
        image_url: null,
        image_versions: ["square", "small"],
        gemini_token: "token123",
        gemini_token_updated_at: new Date().toISOString(),
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
      })
    })

    it("returns false when gemini_token_updated_at is missing", () => {
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token: "token123",
        gemini_token_updated_at: null,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
      })
    })
  })

  describe("#processingFailed", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          processingFailed
        }
      }
    }`

    it("returns false when image has normalized version", () => {
      assign(image, {
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
        gemini_token: "token123",
        gemini_token_updated_at: new Date().toISOString(),
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.processingFailed).toBe(false)
      })
    })

    it("returns true when image is missing normalized version and not processing", () => {
      const oldTime = new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small", "medium"], // Missing normalized
        gemini_token: "token123",
        gemini_token_updated_at: oldTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.processingFailed).toBe(true)
      })
    })

    it("returns false when image is still processing", () => {
      const recentTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"], // Missing normalized
        gemini_token: "token123",
        gemini_token_updated_at: recentTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.processingFailed).toBe(false)
      })
    })

    it("returns false when image_url is missing", () => {
      assign(image, {
        image_url: null,
        image_versions: ["square", "small"],
        gemini_token: "token123",
        gemini_token_updated_at: new Date().toISOString(),
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.processingFailed).toBe(false)
      })
    })
  })

  describe("#isProcessing and #processingFailed combined", () => {
    const query = `{
      artwork(id: "richard-prince-untitled-portrait") {
        image {
          isProcessing
          processingFailed
        }
      }
    }`

    it("returns correct values for a fully processed image", () => {
      assign(image, {
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
        gemini_token: "token123",
        gemini_token_updated_at: new Date().toISOString(),
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
        expect(data.artwork.image.processingFailed).toBe(false)
      })
    })

    it("returns correct values for an image currently processing", () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small"],
        gemini_token: "token123",
        gemini_token_updated_at: recentTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(true)
        expect(data.artwork.image.processingFailed).toBe(false)
      })
    })

    it("returns correct values for an image with failed processing", () => {
      const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      assign(image, {
        image_url: "https://example.com/image.jpg",
        image_versions: ["square", "small", "medium"], // Missing normalized
        gemini_token: "token123",
        gemini_token_updated_at: oldTime,
      })

      return runQuery(query, context).then((data) => {
        expect(data.artwork.image.isProcessing).toBe(false)
        expect(data.artwork.image.processingFailed).toBe(true)
      })
    })
  })
})
