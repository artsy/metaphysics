import { first, isNull, isUndefined } from "lodash"
import normalize, { grab, setVersion } from "schema/image/normalize"

describe("grab", () => {
  it("grabs the first value for a set of possible keys", () => {
    expect(grab({ foo: "bar" }, "foo")).toBe("bar")
    expect(grab({ bar: "baz" }, ["foo", "bar"])).toBe("baz")
    expect(grab({ foo: "bar", bar: "baz" }, ["foo", "bar", "baz"])).toBe("bar")
  })

  it("returns undefined when unable to find a value", () => {
    expect(isUndefined(grab({ foo: "bar" }, "baz"))).toBe(true)
    expect(isUndefined(grab({}, "baz"))).toBe(true)
    expect(isUndefined(grab(null, "baz"))).toBe(true)
  })
})

describe("setVersion", () => {
  const image = {
    image_url: "https://xxx.cloudfront.net/xxx/:version.jpg", // JPG
    image_versions: ["icon", "large", "normalized"],
    image_urls: {
      icon: "https://xxx.cloudfront.net/xxx/icon.png", // PNG
      large: "https://xxx.cloudfront.net/xxx/large.jpg",
      normalized: "https://xxx.cloudfront.net/xxx/normalized.jpg",
    },
  }

  it("works with JPGs", () => {
    expect(setVersion(image, ["large"])).toBe(
      "https://xxx.cloudfront.net/xxx/large.jpg"
    )
  })

  it("works with PNGs", () => {
    expect(setVersion(image, ["icon"])).toBe(
      "https://xxx.cloudfront.net/xxx/icon.png"
    )
  })

  it("supports a prioritized list of versions", () => {
    expect(
      setVersion(image, [
        "version_that_will_fall_thru_because_it_doesnt_exist",
        "icon",
      ])
    ).toBe("https://xxx.cloudfront.net/xxx/icon.png")
  })

  it("falls back to any existy version", () => {
    expect(setVersion(image, ["garbage"])).toBe(
      "https://xxx.cloudfront.net/xxx/large.jpg"
    )
  })

  it("should not include normalized as a fallback", () => {
    expect(setVersion(image)).toBe("https://xxx.cloudfront.net/xxx/large.jpg")
  })
})

describe("image response normalization", () => {
  describe("API returns garbage response", () => {
    const badResponse = [
      {
        original_height: null,
        original_width: null,
        image_url: null,
        image_versions: [],
        image_urls: {},
      },
    ]

    const goodResponse = [
      {
        original_height: 1919,
        original_width: 1352,
        image_url:
          "https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg",
        image_versions: ["tall"],
        image_urls: {
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/tall.jpg",
        },
      },
    ]

    const weirdResponse = [
      {
        original_height: 1919,
        original_width: 1352,
        url:
          "https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg",
        versions: ["tall"],
        urls: {
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/tall.jpg",
        },
      },
    ]

    it("rejects a bad response", () => {
      expect(normalize(badResponse).length).toBe(0)
      expect(isNull(normalize(first(badResponse)))).toBe(true)
    })

    it("allows a good response through", () => {
      expect(normalize(goodResponse).length).toBe(1)
    })

    it("allows a weird response through", () => {
      expect(normalize(weirdResponse).length).toBe(1)
    })

    it("normalizes the keys", () => {
      const normalized = normalize(first(weirdResponse))
      expect(normalized.image_url).toBe(
        "https://d32dm0rphc51dk.cloudfront.net/psvdGBpjBmA07RrOo6bEKw/:version.jpg"
      )
      expect(normalized.image_versions).toEqual(["tall"])
    })

    it("normalizes bare URLs", () => {
      const normalized = normalize("https://xxx.cloudfront.net/xxx/cat.jpg")
      expect(normalized.image_url).toBe(
        "https://xxx.cloudfront.net/xxx/cat.jpg"
      )
    })

    it("doesn't blow up on images without a ':version' substring", () => {
      const normalized = normalize({
        image_url: "https://xxx.cloudfront.net/xxx/cat.jpg",
      })
      expect(normalized.image_url).toBe(
        "https://xxx.cloudfront.net/xxx/cat.jpg"
      )
    })

    it("removes bad responses from mixed response", () => {
      expect(normalize(badResponse.concat(goodResponse)).length).toBe(1)
    })
  })
})
