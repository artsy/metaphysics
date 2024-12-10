import { getEigenVersionNumber } from "../semantic-versioning"

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
