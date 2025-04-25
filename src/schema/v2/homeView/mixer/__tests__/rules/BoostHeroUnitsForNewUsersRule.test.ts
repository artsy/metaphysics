import { HomeViewSection } from "schema/v2/homeView/sections"
import { BoostHeroUnitsForNewUsersRule } from "../../rules/BoostHeroUnitsForNewUsersRule"
import moment from "moment"
import { HeroUnits } from "schema/v2/homeView/sections/HeroUnits"
import { ResolverContext } from "types/graphql"

describe("BoostHeroUnitsForNewUsersRule", () => {
  it("moves HeroUnits near the top if user is new", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      userByIDLoader: jest.fn().mockResolvedValue(NEW_USER),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      { id: "some-section" },
      { id: "another-section" },
      HeroUnits,
    ]

    const boostHeroUnits = new BoostHeroUnitsForNewUsersRule()

    const outputSections = await boostHeroUnits.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      HeroUnits,
      { id: "some-section" },
      { id: "another-section" },
    ])
  })

  it("leaves HeroUnits alone if user is not new", async () => {
    const mockContext: Partial<ResolverContext> = {
      userID: "123",
      userByIDLoader: jest.fn().mockResolvedValue(OLD_USER),
    }

    const inputSections: Partial<HomeViewSection>[] = [
      { id: "quick-links-section" },
      { id: "tasks-section" },
      { id: "some-section" },
      { id: "another-section" },
      HeroUnits,
    ]

    const boostHeroUnits = new BoostHeroUnitsForNewUsersRule()

    const outputSections = await boostHeroUnits.apply(
      inputSections as HomeViewSection[],
      mockContext as ResolverContext
    )

    expect(outputSections).toEqual([
      { id: "quick-links-section" },
      { id: "tasks-section" },
      { id: "some-section" },
      { id: "another-section" },
      HeroUnits,
    ])
  })
})

const NEW_USER = {
  email: "new.user@example.com",
  created_at: moment().subtract(1, "day").toISOString(),
}

const OLD_USER = {
  email: "old.user@example.com",
  created_at: moment().subtract(1, "year").toISOString(),
}
