import { GraphQLLong } from "lib/customTypes/GraphQLLong"

const parseValue = GraphQLLong.parseValue as (value: unknown) => number

describe("GraphQLLong", () => {
  it("takes whole numbers and numeric strings", () => {
    expect(parseValue(0)).toEqual(0)
    expect(parseValue("0")).toEqual(0)
    expect(parseValue(500000)).toEqual(500000)
    expect(parseValue("500000")).toEqual(500000)
  })

  it("rounds a fractional amount to the nearest minor unit", () => {
    // What a client sends for $19.99, since parseFloat("19.99") * 100 lands
    // just under the cent.
    expect(parseValue(1998.9999999999998)).toEqual(1999)
    expect(parseValue(7.000000000000001)).toEqual(7)
    expect(parseValue(4999.5)).toEqual(5000)
    expect(parseValue(-1998.9999999999998)).toEqual(-1999)
  })

  it("refuses a value that is not an amount", () => {
    expect(() => parseValue(true)).toThrow(TypeError)
    expect(() => parseValue(false)).toThrow(TypeError)
    expect(() => parseValue("")).toThrow(TypeError)
    expect(() => parseValue("abc")).toThrow(TypeError)
    expect(() => parseValue(null)).toThrow(TypeError)
    expect(() => parseValue(undefined)).toThrow(TypeError)
    expect(() => parseValue([])).toThrow(TypeError)
  })

  it("refuses a value beyond 52 bits", () => {
    expect(() => parseValue(1e300)).toThrow(TypeError)
    expect(() => parseValue(Number.MAX_SAFE_INTEGER + 10)).toThrow(TypeError)
  })

  it("serializes the same way it parses", () => {
    expect(GraphQLLong.serialize(1998.9999999999998)).toEqual(1999)
    expect(() => GraphQLLong.serialize(null)).toThrow(TypeError)
  })
})
