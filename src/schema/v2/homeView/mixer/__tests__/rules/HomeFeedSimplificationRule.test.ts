import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeFeedSimplificationRule } from "../../rules/HomeFeedSimplificationRule"
import { QuickLinks } from "../../../sections/QuickLinks"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { RecommendedArtworks } from "../../../sections/RecommendedArtworks"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))
import { getExperimentVariant } from "lib/featureFlags"
const mockGetVariant = getExperimentVariant as jest.Mock

describe("HomeFeedSimplificationRule", () => {
  const rule = new HomeFeedSimplificationRule()
  const context = { userID: "123" } as ResolverContext
  const sections = [
    QuickLinks,
    NewWorksForYou,
    RecommendedArtworks,
  ] as HomeViewSection[]

  afterEach(() => jest.clearAllMocks())

  it("is a no-op when the user is not enrolled (variant disabled)", async () => {
    mockGetVariant.mockReturnValue({ enabled: false, name: "disabled" })
    expect(await rule.apply(sections, context)).toBe(sections)
  })

  it("is a no-op for the control arm", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
    expect(await rule.apply(sections, context)).toBe(sections)
  })

  it("is a no-op when Unleash is uninitialized (returns false)", async () => {
    mockGetVariant.mockReturnValue(false)
    expect(await rule.apply(sections, context)).toBe(sections)
  })

  it("is a no-op for an unknown variant name", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "not_an_arm" })
    expect(await rule.apply(sections, context)).toBe(sections)
  })

  it("keys the variant lookup on the user id", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "reduced_current" })
    await rule.apply(sections, context)
    expect(mockGetVariant).toHaveBeenCalledWith(expect.any(String), {
      userId: "123",
    })
  })

  it("composes the reduced_current arm", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "reduced_current" })
    const out = await rule.apply(sections, context)
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      RecommendedArtworks.id,
    ])
  })

  it("composes the hierarchy_breadth arm with reordering", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "hierarchy_breadth" })
    const out = await rule.apply(sections, context)
    // editorial/discover absent from input are skipped; NWFY leads the artworks
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      RecommendedArtworks.id,
    ])
  })
})
