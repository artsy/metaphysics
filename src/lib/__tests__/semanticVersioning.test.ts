import {
  SemanticVersionNumber,
  getEigenVersionNumber,
  isAtLeastVersion,
} from "../semanticVersioning"

describe("getEigenVersionNumber", () => {
  describe("with a typical Eigen user agent string", () => {
    it("parses the version number", () => {
      expect(
        getEigenVersionNumber(
          "unknown iOS/18.1.1 Artsy-Mobile/8.59.0 Eigen/2024.12.10.06/8.59.0"
        )
      ).toEqual({
        major: 8,
        minor: 59,
        patch: 0,
      })
    })
  })

  describe("with a __DEV__ Eigen user agent string", () => {
    it("parses the version number", () => {
      expect(
        getEigenVersionNumber(
          "Artsy-Mobile ios null/null Artsy-Mobile/8.59.0 Eigen/null/8.59.0"
        )
      ).toEqual({
        major: 8,
        minor: 59,
        patch: 0,
      })
    })
  })
  describe("with a typical mobile browser user agent string", () => {
    it("returns null", () => {
      expect(
        getEigenVersionNumber(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1"
        )
      ).toBeNull()
    })
  })

  describe("with a typical desktop browser user agent string", () => {
    it("returns null", () => {
      expect(
        getEigenVersionNumber(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Mobile/15E148 Safari/604.1"
        )
      ).toBeNull()
    })
  })

  describe("with an empty user agent string", () => {
    it("returns null", () => {
      expect(getEigenVersionNumber("")).toBeNull()
    })
  })

  describe("with a gibberish user agent string", () => {
    it("returns null", () => {
      expect(
        getEigenVersionNumber("It’s 2024 so I'm just going to say: Moo Deng")
      ).toBeNull()
    })
  })
})

describe("isAtLeastVersion", () => {
  const candidate: SemanticVersionNumber = {
    major: 42,
    minor: 42,
    patch: 42,
  }

  it("returns true if the candidate version is identical to the minimum version", () => {
    expect(
      isAtLeastVersion(candidate, { major: 42, minor: 42, patch: 42 })
    ).toBe(true)
  })

  it("tests the candidate major version", () => {
    expect(
      isAtLeastVersion(candidate, { major: 41, minor: 42, patch: 42 })
    ).toBe(true)

    expect(
      isAtLeastVersion(candidate, { major: 43, minor: 42, patch: 42 })
    ).toBe(false)
  })

  it("tests the candidate minor version", () => {
    expect(
      isAtLeastVersion(candidate, { major: 42, minor: 41, patch: 42 })
    ).toBe(true)

    expect(
      isAtLeastVersion(candidate, { major: 42, minor: 43, patch: 42 })
    ).toBe(false)
  })

  it("tests the candidate patch version", () => {
    expect(
      isAtLeastVersion(candidate, { major: 42, minor: 42, patch: 41 })
    ).toBe(true)

    expect(
      isAtLeastVersion(candidate, { major: 42, minor: 42, patch: 43 })
    ).toBe(false)
  })
})
