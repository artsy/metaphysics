import { HybridOffsets } from "./hybridOffsets"

const base64 = (str: string) => Buffer.from(str, "utf-8").toString("base64")

describe("HybridOffsets", () => {
  describe("static methods", () => {
    describe("HybridOffsets.empty()", () => {
      it("is initialized with an array of desired keys", () => {
        const test = HybridOffsets.empty(["foo", "bar", "baz"])
        expect(test.state).toEqual({
          foo: null,
          bar: null,
          baz: null,
          position: null,
        })
      })
    })
    describe("HybridOffsets.decode()", () => {
      it("decodes a good base64-encoded cursor", () => {
        const cursor = base64("offsets:position=2&foo=1&bar=1")
        expect(HybridOffsets.decode(cursor).state).toEqual({
          foo: 1,
          bar: 1,
          position: 2,
        })
      })

      it("decodes null values correctly", () => {
        const cursor = HybridOffsets.empty(["foo"]).encoded
        expect(HybridOffsets.decode(cursor).state).toEqual({
          foo: null,
          position: null,
        })
      })

      it("throws on a bad cursor class", () => {
        const cursor = base64("badclass:position=2&foo=1&bar=1")
        expect(() => {
          HybridOffsets.decode(cursor).state
        }).toThrowError()
      })

      it("throws on a non-number offset", () => {
        const cursor = base64("offsets:position=bad&foo=1&bar=1")
        expect(() => {
          HybridOffsets.decode(cursor).state
        }).toThrowError()
      })
    })
  })

  describe("serialized", () => {
    it("serializes the cursor as a query string", () => {
      expect(HybridOffsets.empty(["foo", "bar"]).serialized).toEqual(
        "position=null&foo=null&bar=null"
      )
    })
  })

  describe("encode", () => {
    it("serializes the cursor as a query string", () => {
      const test = HybridOffsets.empty(["foo", "bar", "baz"])
        .increment("foo")
        .increment("bar")
        .increment("foo")
      const encoded = test.encoded
      console.log(encoded)
      const decoded = Buffer.from(encoded, "base64").toString("utf-8")
      expect(decoded).toEqual("offsets:position=2&foo=1&bar=0&baz=null")
    })
  })

  describe("increment()", () => {
    it("returns a new cursor with incremented `key` and position", () => {
      const test = HybridOffsets.empty(["foo", "bar"])
      expect(test.increment("foo").state).toEqual({
        foo: 0,
        bar: null,
        position: 0,
      })
      // expect(test.increment("baz")).toEqual("type error")
    })
  })
})
