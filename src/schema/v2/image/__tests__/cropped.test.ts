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
        "https://gemini.cloudfront.test?height=500&quality=80&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500"
      const url2x =
        "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=1000"

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
        "https://gemini.cloudfront.test?height=500&quality=80&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=500"
      const url2x =
        "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=1000"
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

    it("accepts a quality argument", () => {
      const url1x =
        "https://gemini.cloudfront.test?height=500&quality=90&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=500"
      const url2x =
        "https://gemini.cloudfront.test?height=1000&quality=25&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=1000"
      const bareImageUrl = normalize("https://xxx.cloudfront.net/xxx/cat.jpg")

      expect(
        croppedImageUrl(bareImageUrl, {
          width: 500,
          height: 500,
          quality: [90, 25],
        })
      ).toEqual({
        width: 500,
        height: 500,
        url: url1x,
        src: url1x,
        srcSet: `${url1x} 1x, ${url2x} 2x`,
      })
    })

    it("accepts a single 1x quality argument", () => {
      const url1x =
        "https://gemini.cloudfront.test?height=500&quality=50&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=500"
      const url2x =
        "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fill&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Fcat.jpg&width=1000"
      const bareImageUrl = normalize("https://xxx.cloudfront.net/xxx/cat.jpg")

      expect(
        croppedImageUrl(bareImageUrl, {
          width: 500,
          height: 500,
          quality: [50],
        })
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
