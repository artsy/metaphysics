import {
  invalidArgsMessage,
  pickLoader,
  tokenRequiredMesage,
} from "../heroUnitsConnection"

interface TestSetup {
  args: {
    showAll?: boolean
    term?: string
  }

  context: {
    authenticatedHeroUnitsLoader?: () => void
    heroUnitsLoader?: () => void
    matchHeroUnitsLoader?: () => void
  }
}

describe("pickLoader", () => {
  const testSetup = (): TestSetup => {
    const args = { showAll: false, term: undefined }

    const context = {
      authenticatedHeroUnitsLoader: jest.fn(),
      heroUnitsLoader: jest.fn(),
      matchHeroUnitsLoader: jest.fn(),
    }

    return { args, context }
  }

  describe("without an authenticated loader", () => {
    describe("without the show all flag nor a term", () => {
      it("returns the basic loader", () => {
        const { args, context } = testSetup()
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.heroUnitsLoader)
      })
    })

    describe("with the show all flag", () => {
      it("returns the basic loader", () => {
        const { args, context } = testSetup()
        args.showAll = true
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.heroUnitsLoader)
      })
    })

    describe("with a term", () => {
      it("returns the match loader", () => {
        const { args, context } = testSetup()
        args.term = "trending now"
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.matchHeroUnitsLoader)
      })
    })

    describe("with the show all flag and a term", () => {
      it("throws an error", () => {
        const { args, context } = testSetup()
        args.showAll = true
        args.term = "trending now"
        context.authenticatedHeroUnitsLoader = undefined

        expect(() => {
          pickLoader(args, context)
        }).toThrow(invalidArgsMessage)
      })
    })
  })

  describe("with an authenticated loader", () => {
    describe("without the show all flag nor a term", () => {
      it("returns the basic loader", () => {
        const { args, context } = testSetup()
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.heroUnitsLoader)
      })
    })

    describe("with the show all flag", () => {
      it("returns the authenticated loader", () => {
        const { args, context } = testSetup()
        args.showAll = true

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.authenticatedHeroUnitsLoader)
      })
    })

    describe("with a term", () => {
      it("returns the match loader", () => {
        const { args, context } = testSetup()
        args.term = "trending now"

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.matchHeroUnitsLoader)
      })
    })

    describe("with the show all flag and a term", () => {
      it("throws an error", () => {
        const { args, context } = testSetup()
        args.showAll = true
        args.term = "trending now"

        expect(() => {
          pickLoader(args, context)
        }).toThrow(invalidArgsMessage)
      })
    })
  })

  describe("without a match loader", () => {
    describe("with a term", () => {
      it("throws an error", () => {
        const { args, context } = testSetup()
        args.term = "trending now"
        context.matchHeroUnitsLoader = undefined

        expect(() => {
          pickLoader(args, context)
        }).toThrow(tokenRequiredMesage)
      })
    })
  })
})
