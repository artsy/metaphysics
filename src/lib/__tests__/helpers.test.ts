import {
  camelCaseKeys,
  convertConnectionArgsToGravityArgs,
  exclude,
  isExisty,
  isInteger,
  markdownToText,
  removeEmptyValues,
  removeNulls,
  resolveBlueGreen,
  snakeCaseKeys,
  stripTags,
  toKey,
  toQueryString,
  unescapeEntities,
} from "lib/helpers"

describe("exclude", () => {
  const xs = [
    { id: "foo", name: "Foo" },
    { id: "bar", name: "Bar" },
    { id: "baz", name: "Baz" },
  ]

  it("excludes objects given a list of values and which property to match against", () => {
    expect(exclude(["foo", "baz"], "id")(xs)).toEqual([
      { id: "bar", name: "Bar" },
    ])
  })

  it("simply returns the list if invoked without arguments", () => {
    expect(exclude()(xs)).toEqual(xs)
  })
})

describe("toQueryString", () => {
  it("stringifies regular arraies", () => {
    expect(
      toQueryString({ ids: [13, 27], visible: true, availability: "for sale" })
    ).toBe("ids%5B0%5D=13&ids%5B1%5D=27&visible=true&availability=for%20sale")
  })

  it("ignores empty arraies", () => {
    expect(
      toQueryString({ ids: [], visible: true, availability: "for sale" })
    ).toBe("availability=for%20sale&visible=true")
  })

  it("stringifies [null] as an empty array", () => {
    expect(
      toQueryString({ ids: [null], visible: true, availability: "for sale" })
    ).toBe("ids%5B0%5D=&visible=true&availability=for%20sale")
  })

  it("keeps order when request is batched", () => {
    expect(
      toQueryString({
        visible: true,
        availability: "for sale",
        batched: true,
      })
    ).toBe("visible=true&availability=for%20sale&batched=true")
  })

  it("keeps order of non-empty arrays", () => {
    expect(
      toQueryString({
        ids: [
          "63f115629648b4000c707e37",
          "63c08f8408c833000db6ef58",
          "63ffbe494cc6f7000c920e0f",
          "63fcbacb68aa09000bd2609e",
          "63e67f5a70b792000b9e57c3",
          "63f89ccae5957d000c2ed8a3",
          "63e67f5a9e7407000bec0ec3",
          "63f89d924cc87a000e474c6e",
          "63f38b52380b9e000d788778",
          "63f38510f56dbb000d16e196",
          "63f5421caff176000c3c9c82",
        ],
      })
    ).toBe(
      "ids%5B0%5D=63f115629648b4000c707e37&ids%5B1%5D=63c08f8408c833000db6ef58&ids%5B2%5D=63ffbe494cc6f7000c920e0f&ids%5B3%5D=63fcbacb68aa09000bd2609e&ids%5B4%5D=63e67f5a70b792000b9e57c3&ids%5B5%5D=63f89ccae5957d000c2ed8a3&ids%5B6%5D=63e67f5a9e7407000bec0ec3&ids%5B7%5D=63f89d924cc87a000e474c6e&ids%5B8%5D=63f38b52380b9e000d788778&ids%5B9%5D=63f38510f56dbb000d16e196&ids%5B10%5D=63f5421caff176000c3c9c82"
    )
  })

  it("handles complex nested arrays with objects", () => {
    const result = toQueryString({
      images: [
        { id: "img1", position: 0 },
        { id: "img2", position: 1 },
      ],
    })

    expect(result).toBe(
      "images%5B0%5D%5Bid%5D=img1&images%5B0%5D%5Bposition%5D=0&images%5B1%5D%5Bid%5D=img2&images%5B1%5D%5Bposition%5D=1"
    )
  })
})

describe("toKey", () => {
  it("returns a stringified key given a path", () => {
    expect(toKey("foo/bar")).toBe("foo/bar?")
  })

  it("returns a stringified key given a path and an option", () => {
    expect(toKey("foo/bar", { sort: "asc" })).toBe("foo/bar?sort=asc")
  })

  it("returns a stringified key given a path and multiple options", () => {
    expect(
      toKey("foo/bar", {
        sort: "asc",
        sleep: false,
        size: 10,
      })
    ).toBe("foo/bar?size=10&sleep=false&sort=asc")
  })

  it("does not include undefined options in path", () => {
    expect(
      toKey("foo/bar", {
        sort: "asc",
        sleep: undefined,
        size: 10,
      })
    ).toBe("foo/bar?size=10&sort=asc")
  })

  it("sorts the option keys in alphabetical order", () => {
    expect(
      toKey("foo/bar", {
        a: 3,
        z: "whatever",
        b: 99,
        d: false,
        c: 0,
      })
    ).toBe("foo/bar?a=3&b=99&c=0&d=false&z=whatever")
  })
})

describe("isExisty", () => {
  describe("existy things", () => {
    it("returns `true` for Integers", () => {
      expect(isExisty(0)).toBe(true)
      expect(isExisty(100)).toBe(true)
    })

    it("returns `true` for Strings", () => {
      expect(isExisty("0")).toBe(true)
      expect(isExisty("Foobar")).toBe(true)
      expect(isExisty(" Foo bar ")).toBe(true)
    })

    it("returns `true` for `NaN`", () => {
      expect(isExisty(NaN)).toBe(true)
    })

    it("returns `true` for non-empty Objects", () => {
      expect(isExisty({ foo: "bar" })).toBe(true)
    })
  })

  describe("not existy things", () => {
    it("returns `false` for empty Objects", () => {
      expect(isExisty({})).toBe(false)
    })

    it("returns `false` for empty Strings", () => {
      expect(isExisty("")).toBe(false)
    })

    it("returns `false` for whitespace Strings", () => {
      expect(isExisty(" ")).toBe(false)
      expect(isExisty(" \n ")).toBe(false)
      expect(isExisty(" \n\n")).toBe(false)
    })

    it("returns `false` for `undefined`", () => {
      expect(isExisty(undefined)).toBe(false)
    })

    it("returns `false` for `null`", () => {
      expect(isExisty(null)).toBe(false)
    })
  })
})

describe("stripTags", () => {
  const html = `<a href="http://google.com">Cabbie</a>`

  it("strips html from a string", () => {
    expect(stripTags(html)).toEqual("Cabbie")
  })

  it("returns an empty string if no string is provided", () => {
    expect(stripTags()).toEqual("")
  })
})

describe("removeNulls", () => {
  const objWithNulls = {
    a: "percy",
    b: null,
    c: undefined,
  }

  it("removes null and undefined properties from an object", () => {
    removeNulls(objWithNulls)
    expect(objWithNulls).toHaveProperty("a", "percy")
    expect(objWithNulls).not.toHaveProperty("b")
    expect(objWithNulls).not.toHaveProperty("c")
  })
})

describe("removeEmptyValues", () => {
  const obj = {
    a: "percy",
    b: null,
    c: undefined,
    d: [],
    e: ["cat"],
  }

  it("removes null and undefined properties from an object", () => {
    removeEmptyValues(obj)
    expect(obj).toHaveProperty("a", "percy")
    expect(obj).toHaveProperty("e", ["cat"])
    expect(obj).not.toHaveProperty("b")
    expect(obj).not.toHaveProperty("c")
    expect(obj).not.toHaveProperty("d")
  })
})

describe("resolveBlueGreen", () => {
  const resolveBlue = "https://blue.artsy.test"
  const resolveGreen = "https://green.artsy.test"

  it("resolves to blue by default", () => {
    expect(resolveBlueGreen(resolveBlue)).toBe(resolveBlue)
  })

  it("resolves to blue with blue and green at 0 percent", () => {
    expect(resolveBlueGreen(resolveBlue, resolveGreen, 0)).toBe(resolveBlue)
  })

  it("resolves to green with blue and green at 100 percent", () => {
    expect(resolveBlueGreen(resolveBlue, resolveGreen, 100)).toBe(resolveGreen)
  })
})

describe("unescapeEntities", () => {
  it("unescapes entities", () => {
    const input = markdownToText(
      "i daren't; i'm is 42\" tall & the hoop is 10' high"
    )

    expect(input).toEqual(
      "i daren&#39;t; i&#39;m is 42&quot; tall &amp; the hoop is 10&#39; high"
    )

    expect(unescapeEntities(input)).toEqual(
      "i daren't; i'm is 42\" tall & the hoop is 10' high"
    )
  })
})

describe("convertConnectionArgsToGravityArgs", () => {
  it("works with page-based pagination", () => {
    expect(convertConnectionArgsToGravityArgs({ page: 1, first: 30 })).toEqual({
      page: 1,
      offset: 0,
      size: 30,
    })

    expect(convertConnectionArgsToGravityArgs({ page: 2, first: 30 })).toEqual({
      page: 2,
      offset: 30,
      size: 30,
    })

    expect(convertConnectionArgsToGravityArgs({ page: 3, first: 30 })).toEqual({
      page: 3,
      offset: 60,
      size: 30,
    })
  })

  it("works with cursor-based pagination", () => {
    expect(
      convertConnectionArgsToGravityArgs({
        after: "YXJyYXljb25uZWN0aW9uOi0x",
        first: 30,
      })
    ).toEqual({
      page: 1,
      offset: 0,
      size: 30,
    })

    expect(
      convertConnectionArgsToGravityArgs({
        after: "YXJyYXljb25uZWN0aW9uOjI5",
        first: 30,
      })
    ).toEqual({
      page: 2,
      offset: 30,
      size: 30,
    })

    expect(
      convertConnectionArgsToGravityArgs({
        after: "YXJyYXljb25uZWN0aW9uOjU5",
        first: 30,
      })
    ).toEqual({
      page: 3,
      offset: 60,
      size: 30,
    })
  })
})

describe("isInteger", () => {
  it("only returns true if the input string is a valid integer", () => {
    expect(isInteger("0")).toEqual(true)
    expect(isInteger("1")).toEqual(true)
    expect(isInteger("-1")).toEqual(true)
    expect(isInteger("1.5")).toEqual(false)
    expect(isInteger("test")).toEqual(false)
    expect(isInteger("")).toEqual(false)
    expect(isInteger("   ")).toEqual(false)
    expect(isInteger("1991-1993")).toEqual(false)
    expect(isInteger("1963/64")).toEqual(false)
    expect(isInteger("19th Century")).toEqual(false)
    expect(isInteger("2023, 4, 23")).toEqual(false)
    expect(isInteger("4th-5th Century AD")).toEqual(false)
    expect(isInteger("2000s")).toEqual(false)
  })
})

describe("camelCaseKeys", () => {
  it("converts all object keys to snake case", () => {
    const object = {
      first_name: "John",
      last_name: "Doe",
      age: 42,
      favoritePlant: "cactus",
      id: "123",
    }

    expect(camelCaseKeys(object)).toMatchInlineSnapshot(`
      {
        "age": 42,
        "favoritePlant": "cactus",
        "firstName": "John",
        "id": "123",
        "lastName": "Doe",
      }
    `)
  })

  it("converts id correctly to ID", () => {
    const object = {
      id: "123",
      artist_ids: ["123"],
    }

    expect(camelCaseKeys(object)).toMatchInlineSnapshot(`
      {
        "artistIDs": [
          "123",
        ],
        "id": "123",
      }
    `)
  })
})

describe("snakeCaseKeys", () => {
  it("converts all object keys to snake case", () => {
    const object = {
      firstName: "John",
      lastName: "Doe",
      age: 42,
      favorite_plant: "cactus",
      ID: "123",
    }

    expect(snakeCaseKeys(object)).toMatchInlineSnapshot(`
      {
        "age": 42,
        "favorite_plant": "cactus",
        "first_name": "John",
        "id": "123",
        "last_name": "Doe",
      }
    `)
  })

  it("converts ID correctly to id", () => {
    const object = {
      ID: "123",
      artistIDs: ["123"],
    }

    expect(snakeCaseKeys(object)).toMatchInlineSnapshot(`
      {
        "artist_ids": [
          "123",
        ],
        "id": "123",
      }
    `)
  })
})
