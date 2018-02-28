import normalize from "schema/image/normalize"
import { croppedImageUrl } from "schema/image/cropped"

describe("Image", () => {
  describe("croppedImageUrl", () => {
    const image = {
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["large"],
    }

    it("takes an image response with options and resizes it to crop", () => {
      expect(croppedImageUrl(image, { width: 500, height: 500 })).toEqual({
        width: 500,
        height: 500,
        url:
          "https://gemini.cloudfront.test?resize_to=fill&width=500&height=500&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg", // eslint-disable-line
      })
    })

    it("works with just a url and resizes it to crop", () => {
      const bareImageUrl = normalize("https://xxx.cloudfront.net/xxx/cat.jpg")
      expect(
        croppedImageUrl(bareImageUrl, { width: 500, height: 500 })
      ).toEqual({
        width: 500,
        height: 500,
        url:
          "https://gemini.cloudfront.test?resize_to=fill&width=500&height=500&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg", // eslint-disable-line
      })
    })
  })
})
