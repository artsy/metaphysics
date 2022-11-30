import { resizedImageUrl } from "schema/v2/image/resized"

describe("Image", () => {
  describe("resizedImageUrl", () => {
    describe("landscape input", () => {
      const LANDSCAPE_IMAGE = {
        original_height: 2333,
        original_width: 3500,
        image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
        image_versions: ["large"],
      }

      it("takes an image response with options and resizes it to fit (landscape)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=333&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500"
        const url2x =
          "https://gemini.cloudfront.test?height=666&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=1000"

        expect(
          resizedImageUrl(LANDSCAPE_IMAGE, { width: 500, height: 500 })
        ).toEqual({
          factor: 0.14285714285714285,
          height: 333,
          width: 500,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options and resizes it to fit (portrait)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=333&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500"
        const url2x =
          "https://gemini.cloudfront.test?height=666&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=1000"

        expect(
          resizedImageUrl(LANDSCAPE_IMAGE, { width: 500, height: 500 })
        ).toEqual({
          factor: 0.14285714285714285,
          height: 333,
          width: 500,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options and resizes it to fit (square)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=199&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=300"
        const url2x =
          "https://gemini.cloudfront.test?height=398&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=600"

        expect(
          resizedImageUrl(LANDSCAPE_IMAGE, { width: 300, height: 300 })
        ).toEqual({
          factor: 0.08571428571428572,
          height: 199,
          width: 300,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options (just one dimension) and resizes it to fit", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=333&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500"
        const url2x =
          "https://gemini.cloudfront.test?height=666&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=1000"

        expect(resizedImageUrl(LANDSCAPE_IMAGE, { width: 500 })).toEqual({
          factor: 0.14285714285714285,
          height: 333,
          width: 500,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })
    })

    describe("portrait input", () => {
      const PORTRAIT_IMAGE = {
        original_height: 3500,
        original_width: 2333,
        image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
        image_versions: ["large"],
      }

      it("takes an image response with options and resizes it to fit (landscape)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=500&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=333"
        const url2x =
          "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=666"

        expect(
          resizedImageUrl(PORTRAIT_IMAGE, { width: 500, height: 500 })
        ).toEqual({
          factor: 0.14285714285714285,
          height: 500,
          width: 333,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options and resizes it to fit (portrait)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=500&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=333"
        const url2x =
          "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=666"

        expect(
          resizedImageUrl(PORTRAIT_IMAGE, { width: 500, height: 500 })
        ).toEqual({
          factor: 0.14285714285714285,
          height: 500,
          width: 333,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options and resizes it to fit (square)", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=300&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=199"
        const url2x =
          "https://gemini.cloudfront.test?height=600&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=398"

        expect(
          resizedImageUrl(PORTRAIT_IMAGE, { width: 300, height: 300 })
        ).toEqual({
          factor: 0.08571428571428572,
          height: 300,
          width: 199,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("takes an image response with options (just one dimension) and resizes it to fit", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=750&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=499"
        const url2x =
          "https://gemini.cloudfront.test?height=1500&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=998"

        expect(resizedImageUrl(PORTRAIT_IMAGE, { width: 500 })).toEqual({
          factor: 0.2143163309044149,
          height: 750,
          width: 499,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("accepts a quality argument", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=750&quality=90&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=499"
        const url2x =
          "https://gemini.cloudfront.test?height=1500&quality=25&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=998"

        expect(
          resizedImageUrl(PORTRAIT_IMAGE, { width: 500, quality: [90, 25] })
        ).toEqual({
          factor: 0.2143163309044149,
          height: 750,
          width: 499,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })

      it("accepts a single 1x quality argument", () => {
        const url1x =
          "https://gemini.cloudfront.test?height=750&quality=75&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=499"
        const url2x =
          "https://gemini.cloudfront.test?height=1500&quality=75&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=998"

        expect(
          resizedImageUrl(PORTRAIT_IMAGE, { width: 500, quality: [75] })
        ).toEqual({
          factor: 0.2143163309044149,
          height: 750,
          width: 499,
          url: url1x,
          src: url1x,
          srcSet: `${url1x} 1x, ${url2x} 2x`,
        })
      })
    })

    it("returns a resized image URL when existing image dimensions are lacking", () => {
      const url1x =
        "https://gemini.cloudfront.test?height=500&quality=80&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=500"
      const url2x =
        "https://gemini.cloudfront.test?height=1000&quality=50&resize_to=fit&src=https%3A%2F%2Fxxx.cloudfront.net%2Fxxx%2Flarge.jpg&width=1000"

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
        url: url1x,
        src: url1x,
        srcSet: `${url1x} 1x, ${url2x} 2x`,
      })
    })

    it("returns the original URL when target dimensions are lacking", () => {
      const url = "https://xxx.cloudfront.net/xxx/large.jpg"

      expect(
        resizedImageUrl(
          {
            image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
            image_versions: ["large"],
          },
          {}
        )
      ).toEqual({
        factor: 1,
        width: null,
        height: null,
        url: url,
        src: url,
        srcSet: `${url} 1x`,
      })
    })
  })
})
