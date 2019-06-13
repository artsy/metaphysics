import { deprecate, shouldBeRemoved } from "../deprecation"

describe("deprecation", () => {
  describe(deprecate, () => {
    it("generates a deprecation reason that encodes the version from whence the field will be removed", () => {
      expect(
        deprecate({ inVersion: 2, preferUsageOf: "foo" })
      ).toMatchInlineSnapshot(
        `"Prefer to use \`foo\`. [Will be removed in v2]"`
      )
    })

    it("appends the encoded version from whence the field will be removed", () => {
      expect(
        deprecate({ inVersion: 2, reason: "Just don't do it." })
      ).toMatchInlineSnapshot(`"Just don't do it. [Will be removed in v2]"`)
    })
  })

  describe(shouldBeRemoved, () => {
    it("should not be removed if there is no deprecation reason", () => {
      expect(
        shouldBeRemoved({
          deprecationReason: null,
          inVersion: 2,
          typeName: "Foo",
          fieldName: "bar",
        })
      ).toEqual(false)
      expect(
        shouldBeRemoved({
          deprecationReason: undefined,
          inVersion: 2,
          typeName: "Foo",
          fieldName: "bar",
        })
      ).toEqual(false)
    })

    it("should not be removed if the deprecation is for a newer version", () => {
      expect(
        shouldBeRemoved({
          deprecationReason: deprecate({ preferUsageOf: "foo", inVersion: 2 }),
          inVersion: 3,
          typeName: "Foo",
          fieldName: "bar",
        })
      ).toEqual(false)
    })

    it("should be removed if the deprecation is for the given version", () => {
      expect(
        shouldBeRemoved({
          deprecationReason: deprecate({ preferUsageOf: "foo", inVersion: 2 }),
          inVersion: 2,
          typeName: "Foo",
          fieldName: "bar",
        })
      ).toEqual(true)
    })
  })
})
