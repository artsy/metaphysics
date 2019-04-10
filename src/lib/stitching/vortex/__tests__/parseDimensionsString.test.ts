import { parseDimensionsString } from "../stitching"

jest.mock("util", () => ({ error: jest.fn(), inherits: jest.fn() }))

const { error } = require("util")

describe(parseDimensionsString, () => {
  beforeEach(() => {
    ;(error as jest.Mock).mockReset()
  })
  it("parses dimensions strings with width and height", () => {
    expect(parseDimensionsString("48 × 60 cm")).toEqual({
      width: 48,
      height: 60,
    })
  })

  it("parses dimensions strings with width and height and depth, but ignores depth for now", () => {
    expect(parseDimensionsString("41 × 63 × 61 cm")).toEqual({
      width: 41,
      height: 63,
    })
  })

  it("doesn't care what the units are", () => {
    expect(parseDimensionsString("2 × 3 × 1 in")).toEqual({
      width: 2,
      height: 3,
    })
  })

  it("can cope with floats", () => {
    expect(parseDimensionsString("2.3 × 3.234 × 1.0 cm")).toEqual({
      width: 2.3,
      height: 3.234,
    })
  })

  it("returns null and logs an error if the string is malformed", () => {
    expect(parseDimensionsString("2.3 × 3.234× cm")).toBeNull()
    expect(error).toHaveBeenCalledTimes(1)
    expect(parseDimensionsString("2.3× 3.234 cm")).toBeNull()
    expect(error).toHaveBeenCalledTimes(2)
    expect(parseDimensionsString("2.3 × 3.234cm")).toBeNull()
    expect(error).toHaveBeenCalledTimes(3)
  })
})
