import { assign } from "lodash"
import { getDefault } from "schema/image"

import { runQuery } from "test/utils"

describe("getDefault", () => {
  it("returns the default image", () => {
    expect(
      getDefault([{ id: "foo", is_default: false }, { id: "bar", is_default: true }, { id: "baz", is_default: false }])
        .id
    ).toBe("bar")
  })

  it("returns the first object if there is no default", () => {
    expect(getDefault([{ id: "foo" }, { id: "bar" }, { id: "baz" }]).id).toBe("foo")
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
  let rootValue = null

  beforeEach(() => {
    artwork = {
      id: "richard-prince-untitled-portrait",
      title: "untitled-portrait",
      artists: [],
      images: [image],
    }
    rootValue = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
    }
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

      return runQuery(query, rootValue).then(data => {
        expect(data.artwork.image.orientation).toBe("square")
      })
    })

    it("detects portrait", () => {
      assign(image, { original_width: 1000, original_height: 1500 })

      return runQuery(query, rootValue).then(data => {
        expect(data.artwork.image.orientation).toBe("portrait")
      })
    })

    it("detects landscape", () => {
      assign(image, { original_width: 2000, original_height: 1500 })

      return runQuery(query, rootValue).then(data => {
        expect(data.artwork.image.orientation).toBe("landscape")
      })
    })

    it("detects square", () => {
      assign(image, { original_width: 2000, original_height: 2000 })

      return runQuery(query, rootValue).then(data => {
        expect(data.artwork.image.orientation).toBe("square")
      })
    })
  })
})
