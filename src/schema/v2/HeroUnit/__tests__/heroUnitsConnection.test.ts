import { pickLoader, tokenRequiredMesage } from "../heroUnitsConnection"

interface TestSetup {
  args: {
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
    const args = { term: "trending now" }

    const context = {
      authenticatedHeroUnitsLoader: jest.fn(),
      heroUnitsLoader: jest.fn(),
      matchHeroUnitsLoader: jest.fn(),
    }

    return { args, context }
  }

  describe("without an authenticated loader", () => {
    describe("without a term", () => {
      it("returns the basic loader", () => {
        const { args, context } = testSetup()
        args.term = undefined
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.heroUnitsLoader)
      })
    })

    describe("with a term", () => {
      it("returns the match loader", () => {
        const { args, context } = testSetup()
        context.authenticatedHeroUnitsLoader = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.matchHeroUnitsLoader)
      })
    })
  })

  describe("with an authenticated loader", () => {
    describe("without a term", () => {
      it("returns the authenticated loader", () => {
        const { args, context } = testSetup()
        args.term = undefined

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.authenticatedHeroUnitsLoader)
      })
    })

    describe("with a term", () => {
      it("returns the match loader", () => {
        const { args, context } = testSetup()

        const loader = pickLoader(args, context)

        expect(loader).toEqual(context.matchHeroUnitsLoader)
      })
    })
  })

  describe("without a match loader", () => {
    describe("with a term", () => {
      it("throws an error", () => {
        const { args, context } = testSetup()
        context.matchHeroUnitsLoader = undefined

        expect(() => {
          pickLoader(args, context)
        }).toThrow(tokenRequiredMesage)
      })
    })
  })
})
