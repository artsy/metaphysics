// Adapted from https://github.com/artsy/force/blob/9fb0f70c7abda2db06a79d80d4a77dea68c53334/src/Utils/Hooks/__tests__/useStableShuffle.jest.tsx

import { dailyShuffle, mulberry32, seededShuffle, xmur3 } from "../shuffle"

describe("xmur3", () => {
  it("returns a deterministic, hashed sequence", () => {
    const hashA = xmur3("hello world")

    expect(hashA()).toEqual(2225606010)
    expect(hashA()).toEqual(2106958649)

    const hashB = xmur3("goodbye world")

    expect(hashB()).toEqual(534649177)
    expect(hashB()).toEqual(1317567859)
  })
})

describe("mulberry32", () => {
  it("returns a deterministic number sequence between 0 and 1", () => {
    const randomA = mulberry32(1)

    expect(randomA()).toEqual(0.6270739405881613)
    expect(randomA()).toEqual(0.002735721180215478)

    const randomB = mulberry32(99)

    expect(randomB()).toEqual(0.2604658124037087)
    expect(randomB()).toEqual(0.8048227655235678)
  })
})

describe("seededShuffle", () => {
  it("returns a function", () => {
    const { shuffle } = seededShuffle("a seed")
    expect(shuffle).toBeFunction()
  })

  describe("the returned shuffle() function", () => {
    it("shuffles an array deterministically", () => {
      const { shuffle } = seededShuffle("any seed will do")
      const result = shuffle([1, 2, 3, 4, 5])
      expect(result).toEqual([3, 5, 4, 1, 2])
    })

    it("produces a stable sequence of shuffles", () => {
      const { shuffle } = seededShuffle("very stable genius ordering")
      expect(shuffle([1, 2, 3, 4, 5])).toEqual([2, 1, 4, 5, 3])
      expect(shuffle([1, 2, 3, 4, 5])).toEqual([4, 5, 2, 1, 3])
      expect(shuffle([1, 2, 3, 4, 5])).toEqual([2, 1, 4, 3, 5])
      expect(shuffle([1, 2, 3, 4, 5])).toEqual([4, 3, 5, 2, 1])
      expect(shuffle([1, 2, 3, 4, 5])).toEqual([2, 3, 5, 1, 4])
    })
  })
})
