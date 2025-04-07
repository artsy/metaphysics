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
})
