import { imageFromGravity } from "../gravityImage"

describe("imageFromGravity", () => {
  it("returns the versioned shape when image_urls is present", () => {
    expect(
      imageFromGravity("https://example.com/:version.jpg", {
        large: "https://example.com/large.jpg",
        small: "https://example.com/small.jpg",
      })
    ).toEqual({
      image_url: "https://example.com/:version.jpg",
      image_urls: {
        large: "https://example.com/large.jpg",
        small: "https://example.com/small.jpg",
      },
      image_versions: ["large", "small"],
    })
  })

  it("returns a plain image_url before Gemini processing finishes", () => {
    expect(imageFromGravity("https://picsum.photos/200", null)).toEqual({
      image_url: "https://picsum.photos/200",
    })
  })

  it("returns null for a :version template with no image_urls", () => {
    expect(
      imageFromGravity("https://example.com/:version.jpg", null)
    ).toBeNull()
  })

  it("returns null when there is no image at all", () => {
    expect(imageFromGravity(null, null)).toBeNull()
  })
})
