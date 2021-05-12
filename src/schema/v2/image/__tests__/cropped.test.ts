import normalize from "schema/v2/image/normalize"
import { croppedImageUrl } from "schema/v2/image/cropped"

describe("Image", () => {
  describe("croppedImageUrl", () => {
    const image = {
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["large"],
    }

    it("takes an image response with options and resizes it to crop", () => {
      const url1x =
        "https://gemini.cloudfront.test?resize_to=fill&width=500&height=500&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg"
      const url2x =
        "https://gemini.cloudfront.test?resize_to=fill&width=1000&height=1000&quality=50&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg"

      expect(croppedImageUrl(image, { width: 500, height: 500 })).toEqual({
        width: 500,
        height: 500,
        url: url1x,
        src: url1x,
        srcSet: `${url1x} 1x, ${url2x} 2x`,
      })
    })

    it("works with just a url and resizes it to crop", () => {
      const url1x =
        "https://gemini.cloudfront.test?resize_to=fill&width=500&height=500&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg"
      const url2x =
        "https://gemini.cloudfront.test?resize_to=fill&width=1000&height=1000&quality=50&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg"
      const bareImageUrl = normalize("https://xxx.cloudfront.net/xxx/cat.jpg")

      expect(
        croppedImageUrl(bareImageUrl, { width: 500, height: 500 })
      ).toEqual({
        width: 500,
        height: 500,
        url: url1x,
        src: url1x,
        srcSet: `${url1x} 1x, ${url2x} 2x`,
      })
    })
  })
})
