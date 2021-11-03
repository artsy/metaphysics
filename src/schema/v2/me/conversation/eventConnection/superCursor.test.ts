import { SuperCursor } from "./superCursor"

describe("SuperCursor", () => {
  describe("static methods", () => {
    describe("SuperCursor.empty()", () => {
      it("is initialized with an array of desired keys", () => {
        const test = SuperCursor.empty(["foo", "bar", "baz"])
        expect(test.offsets).toEqual({ foo: 0, bar: 0, baz: 0, position: 0 })
      })
    })
    describe("SuperCursor.decode()", () => {
      it("decodes a good cursor", () => {
        const cursor = "c3VwZXJjdXJzb3I6cG9zaXRpb249MiZmb289MSZiYXI9MQ=="
        expect(SuperCursor.decode(cursor).offsets).toEqual({
          foo: 1,
          bar: 1,
          position: 2,
        })
      })
      it("throws on a bad cursor", () => {
        const cursor = "c3Rpbmtlcjpwb3NpdGlvbj0yJmZvbz0xJmJhcj0x"
        expect(() => {
          SuperCursor.decode(cursor).offsets
        }).toThrowError()
      })
    })
  })

  describe("serialized", () => {
    it("serializes the cursor as a query string", () => {
      expect(SuperCursor.empty(["foo", "bar"]).serialized).toEqual(
        "position=0&foo=0&bar=0"
      )
    })
  })

  describe("encode", () => {
    it("serializes the cursor as a query string", () => {
      const test = SuperCursor.empty(["foo", "bar"])
        .increment("foo")
        .increment("bar")
      const encoded = test.encoded
      const decoded = Buffer.from(encoded, "base64").toString("utf-8")
      expect(decoded).toEqual("supercursor:position=2&foo=1&bar=1")
    })
  })

  describe("increment()", () => {
    it("returns a new cursor with incremented `key` and position", () => {
      const test = SuperCursor.empty(["foo", "bar"])
      expect(test.increment("foo").offsets).toEqual({
        foo: 1,
        bar: 0,
        position: 1,
      })
      // expect(test.increment("baz")).toEqual("type error")
    })
  })
})
