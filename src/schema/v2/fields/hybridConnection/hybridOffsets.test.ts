import { base64 } from "lib/base64"
import { HybridOffsets } from "./hybridOffsets"

describe("HybridOffsets", () => {
  describe("static methods", () => {
    describe("HybridOffsets.empty()", () => {
      it("is initialized with an array of desired keys", () => {
        const test = HybridOffsets.empty(["foo", "bar", "baz"])
        expect(test.state).toEqual({
          foo: 0,
          bar: 0,
          baz: 0,
          _position: null,
        })
      })
    })
    describe("HybridOffsets.decode()", () => {
      it("decodes a good base64-encoded cursor", () => {
        const cursor = base64("offsets:_position=2&foo=1&bar=1")
        expect(HybridOffsets.decode(cursor).state).toEqual({
          foo: 1,
          bar: 1,
          _position: 2,
        })
      })

      it("decodes null values correctly", () => {
        const cursor = HybridOffsets.empty(["foo"]).encoded
        expect(HybridOffsets.decode(cursor).state).toEqual({
          foo: 0,
          _position: null,
        })
      })

      it("throws on a bad cursor class", () => {
        const cursor = base64("badclass_position=2&foo=1&bar=1")
        expect(() => {
          HybridOffsets.decode(cursor).state
        }).toThrowError()
      })

      it("throws on a non-number offset", () => {
        const cursor = base64("offsets_position=bad&foo=1&bar=1")
        expect(() => {
          HybridOffsets.decode(cursor).state
        }).toThrowError()
      })
    })
  })

  describe("serialized", () => {
    it("serializes the cursor as a query string", () => {
      expect(HybridOffsets.empty(["foo", "bar"]).serialized).toEqual(
        "_position=null&foo=0&bar=0"
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
      const decoded = Buffer.from(encoded, "base64").toString("utf-8")
      expect(decoded).toEqual("offsets:_position=2&foo=2&bar=1&baz=0")
    })
  })

  describe("increment()", () => {
    it("returns a new cursor with incremented `key`", () => {
      const test = HybridOffsets.empty(["foo", "bar"])
      expect(test.increment("foo").state).toEqual({
        foo: 1,
        bar: 0,
        _position: 0,
      })
    })
  })
})
