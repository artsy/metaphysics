import { versionedImageUrl } from "schema/image/versioned"

describe("Image", () => {
  describe("versionedImageUrl", () => {
    const image = {
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["four_thirds"],
    }

    it("takes an image response with options and resizes it to crop", () => {
      expect(versionedImageUrl(image, { version: "four_thirds" })).toBe(
        "https://xxx.cloudfront.net/xxx/four_thirds.jpg"
      )
    })

    describe("without image_url", () => {
      it("returns undefined", () => {
        expect(versionedImageUrl({}, { version: "four_thirds" })).toBe(
          undefined
        )
      })
    })
  })
})
