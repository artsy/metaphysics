import { Kind } from "graphql/language"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"

describe("GraphQLLong", () => {
  describe("parseLiteral", () => {
    it("parses an in-range integer literal", () => {
      expect(
        GraphQLLong.parseLiteral({ kind: Kind.INT, value: "500000" }, undefined)
      ).toEqual(500000)
    })

    it("rejects a literal that is not an integer", () => {
      expect(
        GraphQLLong.parseLiteral(
          { kind: Kind.STRING, value: "500000", block: false },
          undefined
        )
      ).toBeUndefined()

      expect(
        GraphQLLong.parseLiteral(
          { kind: Kind.FLOAT, value: "4999.5" },
          undefined
        )
      ).toBeUndefined()
    })

    it("rejects an integer literal beyond 52 bits", () => {
      expect(
        GraphQLLong.parseLiteral(
          { kind: Kind.INT, value: "9007199254740993" },
          undefined
        )
      ).toBeUndefined()
    })
  })
})
