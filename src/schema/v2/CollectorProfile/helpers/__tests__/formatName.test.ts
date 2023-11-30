import formatName, { formatPublicName } from "../formatName"

describe("formatName", () => {
  it("should format name in public format", () => {
    const result = formatName("Shara Hughes", "public")
    expect(result).toBe("Shara H.")
  })

  it("should format name in default format", () => {
    const result = formatName("Shara Hughes", "default")
    expect(result).toBe("Shara Hughes")
  })
})

describe("formatPublicName", () => {
  it("should format public name without middle names", () => {
    const result = formatPublicName("Shara Hughes")
    expect(result).toBe("Shara H.")
  })

  it("should format public name with only first name", () => {
    const result = formatPublicName("Shara")
    expect(result).toBe("Shara")
  })

  it("should format public name when there is the middle name", () => {
    const result = formatPublicName("John Second Doe")
    expect(result).toBe("John D.")
  })

  it("should throw an error for invalid input", () => {
    expect(() => formatPublicName(undefined as any)).toThrowError(
      "Invalid name."
    )
  })
})
