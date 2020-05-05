import {
  exclude,
  toKey,
  isExisty,
  removeNulls,
  stripTags,
  resolveBlueGreen,
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
