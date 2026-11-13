import { convertToCents, parsePriceRangeValues } from "lib/moneyHelper"

describe("convertToCents", () => {
  it("returns the value in cents", () => {
    expect(convertToCents(100)).toBe(10000)
  })
})

describe("parsePriceRangeValues", () => {
  it("returns the price range values", () => {
    expect(parsePriceRangeValues("100-200")).toEqual([10000, 20000])
    expect(parsePriceRangeValues("100-*")).toEqual([10000, undefined])
    expect(parsePriceRangeValues("*-200")).toEqual([undefined, 20000])
    expect(parsePriceRangeValues("*-*")).toEqual([undefined, undefined])
    expect(parsePriceRangeValues("asd-fgh")).toEqual([undefined, undefined])
  })

  it("returns empty array if range is empty", () => {
    expect(parsePriceRangeValues("")).toEqual([])
    expect(parsePriceRangeValues(undefined)).toEqual([])
  })
})
