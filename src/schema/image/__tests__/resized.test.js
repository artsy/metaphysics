import { resizedImageUrl } from "schema/image/resized"

describe("Image", () => {
  describe("resizedImageUrl", () => {
    const image = {
      original_height: 2333,
      original_width: 3500,
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["large"],
    }

    it("takes an image response with options and resizes it to fit", () => {
      expect(resizedImageUrl(image, { width: 500, height: 500 })).toEqual({
        factor: 0.14285714285714285,
        height: 333,
        width: 500,
        url:
          "https://gemini.cloudfront.test?resize_to=fit&width=500&height=333&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg", // eslint-disable-line
      })
    })

    it("takes an image response with options (just one dimension) and resizes it to fit", () => {
      expect(resizedImageUrl(image, { width: 500 })).toEqual({
        factor: 0.14285714285714285,
        height: 333,
        width: 500,
        url:
          "https://gemini.cloudfront.test?resize_to=fit&width=500&height=333&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg", // eslint-disable-line
      })
    })

    it("returns a resized image URL when existing image dimensions are lacking", () => {
      expect(
        resizedImageUrl(
          {
            image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
            image_versions: ["large"],
          },
          {
            width: 500,
            height: 500,
          }
        )
      ).toEqual({
        factor: Infinity,
        width: null,
        height: null,
        url:
          "https://gemini.cloudfront.test?resize_to=fit&width=500&height=500&quality=80&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg", // eslint-disable-line
      })
    })
  })
})
