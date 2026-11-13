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

describe("dailyShuffle", () => {
  describe("with no time zone specified", () => {
    it("produces a stable shuffle for an entire UTC day", () => {
      const veryEarly = new Date("2022-11-15T01:00:00Z").valueOf()
      const veryLate = new Date("2022-11-15T23:00:00Z").valueOf()
      const nextDay = new Date("2022-11-16T01:00:00Z").valueOf()

      // early in the day - same
      jest.spyOn(global.Date, "now").mockImplementation(() => veryEarly)
      expect(dailyShuffle([1, 2, 3, 4, 5])).toEqual([4, 2, 5, 3, 1])

      // late in the day - same
      jest.spyOn(global.Date, "now").mockImplementation(() => veryLate)
      expect(dailyShuffle([1, 2, 3, 4, 5])).toEqual([4, 2, 5, 3, 1])

      // next day - different
      jest.spyOn(global.Date, "now").mockImplementation(() => nextDay)
      expect(dailyShuffle([1, 2, 3, 4, 5])).toEqual([3, 4, 1, 5, 2])
    })
  })

  describe("with a valid time zone specified", () => {
    it("produces a stable shuffle for an entire day in that time zone", () => {
      const veryEarly = new Date("2022-11-15T01:00:00-05:00").valueOf()
      const veryLate = new Date("2022-11-15T23:00:00-05:00").valueOf()
      const nextDay = new Date("2022-11-16T01:00:00-05:00").valueOf()
      const nycTime = "America/New_York"

      // early in the day - same
      jest.spyOn(global.Date, "now").mockImplementation(() => veryEarly)
      expect(dailyShuffle([1, 2, 3, 4, 5], nycTime)).toEqual([4, 2, 5, 3, 1])

      // late in the day - same
      jest.spyOn(global.Date, "now").mockImplementation(() => veryLate)
      expect(dailyShuffle([1, 2, 3, 4, 5], nycTime)).toEqual([4, 2, 5, 3, 1])

      // next day - different
      jest.spyOn(global.Date, "now").mockImplementation(() => nextDay)
      expect(dailyShuffle([1, 2, 3, 4, 5], nycTime)).toEqual([3, 4, 1, 5, 2])
    })
  })

  describe("with an invalid time zone", () => {
    it("does not error", () => {
      expect(() => dailyShuffle([1, 2, 3, 4, 5], "lol/jk")).not.toThrow()
    })
    it("falls back to default UTC behavior", () => {
      const veryEarly = new Date("2022-11-15T01:00:00Z").valueOf()
      jest.spyOn(global.Date, "now").mockImplementation(() => veryEarly)
      expect(dailyShuffle([1, 2, 3, 4, 5], "lol/jk")).toEqual([4, 2, 5, 3, 1])
    })
  })
})
