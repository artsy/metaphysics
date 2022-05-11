import { Artwork } from "types/runtime/gravity"
import { isTooBig, isTwoDimensional } from "../utilities"

describe("isTwoDimensional", () => {
  let artwork: Artwork

  beforeEach(() => {
    artwork = {
      ...artwork,
      width: null,
      height: null,
      diameter: null,
      depth: null,
      metric: null,
      width_cm: null,
      height_cm: null,
      depth_cm: null,
      diameter_cm: null,
    }
  })

  describe("artwork has diameter", () => {
    it("returns false", () => {
      artwork.diameter_cm = 1
      artwork.width_cm = 1
      artwork.height_cm = 1
      artwork.depth_cm = 1

      expect(isTwoDimensional(artwork)).toBe(false)
    })
  })

  describe("artwork has null depth", () => {
    it("returns false", () => {
      artwork.width_cm = 1
      artwork.height_cm = 1
      artwork.depth_cm = null

      expect(isTwoDimensional(artwork)).toBe(false)
    })
  })

  describe("artwork is too deep", () => {
    it("returns false", () => {
      artwork.width_cm = 1
      artwork.height_cm = 1
      artwork.depth_cm = 30

      expect(isTwoDimensional(artwork)).toBe(false)
    })
  })

  describe("artwork has no width", () => {
    it("returns false", () => {
      artwork.height_cm = 1
      artwork.depth_cm = 1

      expect(isTwoDimensional(artwork)).toBe(false)
    })
  })

  describe("artwork has no height", () => {
    it("returns false", () => {
      artwork.width_cm = 1
      artwork.depth_cm = 1

      expect(isTwoDimensional(artwork)).toBe(false)
    })
  })

  describe("artwork is two-dimensional", () => {
    it("returns true", () => {
      artwork.width_cm = 1
      artwork.height_cm = 1
      artwork.depth_cm = 1
      expect(isTwoDimensional(artwork)).toBe(true)
    })
  })
})

describe("isTooBig", () => {
  let artwork: Artwork

  beforeEach(() => {
    artwork = {
      ...artwork,
      width: null,
      height: null,
      metric: null,
    }
  })

  describe("artwork has null width", () => {
    it("returns true", () => {
      artwork.height = "1"
      artwork.metric = "cm"

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has null height", () => {
    it("returns true", () => {
      artwork.width = "1"
      artwork.metric = "cm"

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has null metric", () => {
    it("returns true", () => {
      artwork.height = "1"
      artwork.width = "1"

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has oversize width", () => {
    it("returns true", () => {
      artwork.height = "1"
      artwork.width = "2000"
      artwork.metric = "cm"

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has oversize height", () => {
    it("returns true", () => {
      artwork.height = "10000"
      artwork.width = "2"
      artwork.metric = "cm"

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork is a reasonable size", () => {
    it("returns false", () => {
      artwork.height = "100"
      artwork.width = "20"
      artwork.metric = "cm"

      expect(isTooBig(artwork)).toBe(false)
    })
  })
})
