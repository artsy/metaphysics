import { deprecate, shouldBeRemoved, deprecateType } from "../deprecation"
import { GraphQLObjectType, GraphQLString } from "graphql"

describe("deprecation", () => {
  describe("deprecate", () => {
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

  describe("deprecateType", () => {
    it("marks all fields of a type as deprecated", () => {
      const type = deprecateType(
        { inVersion: 2, preferUsageOf: "AnotherType" },
        new GraphQLObjectType({
          name: "DeprecatedType",
          fields: {
            aField: {
              type: GraphQLString,
            },
            anotherField: {
              type: GraphQLString,
            },
          },
        })
      )
      expect(type.getFields().aField.deprecationReason).toMatchInlineSnapshot(
        `"The \`DeprecatedType\` type has been deprecated. Prefer to use the \`AnotherType\` type instead. [Will be removed in v2]"`
      )
      expect(
        type.getFields().anotherField.deprecationReason
      ).toMatchInlineSnapshot(
        `"The \`DeprecatedType\` type has been deprecated. Prefer to use the \`AnotherType\` type instead. [Will be removed in v2]"`
      )
    })

    it("lazily evaluates a fields thunk", () => {
      const thunk = jest.fn(() => ({
        aField: {
          type: GraphQLString,
        },
      }))
      const type = deprecateType(
        { inVersion: 2, preferUsageOf: "AnotherType" },
        new GraphQLObjectType({
          name: "DeprecatedType",
          fields: thunk,
        })
      )
      expect(thunk).not.toHaveBeenCalled()
      expect(type.getFields().aField.deprecationReason).not.toBeUndefined()
      expect(thunk).toHaveBeenCalled()
    })

    it("does not mutate existing field config objects", () => {
      const aField = {
        type: GraphQLString,
      }
      deprecateType(
        { inVersion: 2, preferUsageOf: "AnotherType" },
        new GraphQLObjectType({
          name: "DeprecatedType",
          fields: { aField },
        })
      )
      expect(aField["deprecationReason"]).toBeUndefined()
    })
  })

  describe("shouldBeRemoved", () => {
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
