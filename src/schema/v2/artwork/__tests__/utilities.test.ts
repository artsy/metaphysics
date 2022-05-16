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
      width_cm: null,
      height_cm: null,
      diameter_cm: null,
    }
  })

  describe("artwork has no width, height, or diameter", () => {
    it("returns true", () => {
      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has height and null width", () => {
    it("returns true", () => {
      artwork.height_cm = 1

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has width and null height", () => {
    it("returns true", () => {
      artwork.width_cm = 1

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has oversize width", () => {
    it("returns true", () => {
      artwork.height_cm = 1
      artwork.width_cm = 2000

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has oversize height", () => {
    it("returns true", () => {
      artwork.height_cm = 10000
      artwork.width_cm = 2

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has oversize diamater", () => {
    it("returns true", () => {
      artwork.diameter_cm = 10000

      expect(isTooBig(artwork)).toBe(true)
    })
  })

  describe("artwork has height and width < 1524 cm", () => {
    it("returns false", () => {
      artwork.height_cm = 100
      artwork.width_cm = 20

      expect(isTooBig(artwork)).toBe(false)
    })
  })

  describe("artwork has diameter < 1524 cm", () => {
    it("returns false", () => {
      artwork.diameter_cm = 100

      expect(isTooBig(artwork)).toBe(false)
    })
  })
})
