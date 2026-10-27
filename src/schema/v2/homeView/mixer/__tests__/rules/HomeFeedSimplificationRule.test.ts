import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import { HomeFeedSimplificationRule } from "../../rules/HomeFeedSimplificationRule"
import { QuickLinks } from "../../../sections/QuickLinks"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { RecommendedArtworks } from "../../../sections/RecommendedArtworks"
import { CuratedGroup } from "../../../sections/CuratedGroup"

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
    expect(await rule.apply(sections, context)).toEqual(sections)
  })

  it("is a no-op for the control arm", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
    expect(await rule.apply(sections, context)).toEqual(sections)
  })

  // Regression: a flag-on "control" variant has the experiment toggle enabled, so
  // experiment-only sections pass the display filter. The control arm must still
  // strip them so they don't leak into the baseline feed.
  it("strips experiment-only sections for a flag-on control variant", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
    const withGroup = [...sections, CuratedGroup] as HomeViewSection[]
    const out = await rule.apply(withGroup, context)
    expect(out.find((s) => s.id === CuratedGroup.id)).toBeUndefined()
    expect(out.map((s) => s.id)).toEqual(sections.map((s) => s.id))
  })

  it("is a no-op when Unleash is uninitialized (returns false)", async () => {
    mockGetVariant.mockReturnValue(false)
    expect(await rule.apply(sections, context)).toEqual(sections)
  })

  it("is a no-op for an unknown variant name", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "not_an_arm" })
    expect(await rule.apply(sections, context)).toEqual(sections)
  })

  it("keys the variant lookup on the user id", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "consolidated" })
    await rule.apply(sections, context)
    expect(mockGetVariant).toHaveBeenCalledWith(expect.any(String), {
      userId: "123",
    })
  })

  it("composes the consolidated arm with reordering", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "consolidated" })
    const out = await rule.apply(sections, context)
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      RecommendedArtworks.id,
    ])
  })

  describe("x-home-feed-arm override", () => {
    it("forces the arm from context, bypassing Unleash", async () => {
      mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
      const overrideContext = {
        userID: "123",
        xHomeFeedArm: "consolidated",
      } as ResolverContext

      const out = await rule.apply(sections, overrideContext)

      expect(out.map((s) => s.id)).toEqual([
        QuickLinks.id,
        NewWorksForYou.id,
        RecommendedArtworks.id,
      ])
      expect(mockGetVariant).not.toHaveBeenCalled()
    })

    it("ignores an invalid override and falls back to Unleash", async () => {
      mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
      const overrideContext = {
        userID: "123",
        xHomeFeedArm: "not_an_arm",
      } as ResolverContext

      expect(await rule.apply(sections, overrideContext)).toEqual(sections)
      expect(mockGetVariant).toHaveBeenCalled()
    })
  })

  describe("homeViewAppliedArm (debug stash)", () => {
    it("records the override arm and source", async () => {
      mockGetVariant.mockReturnValue({ enabled: true, name: "control" })
      const ctx = {
        userID: "123",
        xHomeFeedArm: "consolidated",
      } as ResolverContext

      await rule.apply(sections, ctx)

      expect(ctx.homeViewAppliedArm).toEqual({
        arm: "consolidated",
        source: "override",
      })
    })

    it("records the Unleash arm and source", async () => {
      mockGetVariant.mockReturnValue({
        enabled: true,
        name: "consolidated",
      })
      const ctx = { userID: "123" } as ResolverContext

      await rule.apply(sections, ctx)

      expect(ctx.homeViewAppliedArm).toEqual({
        arm: "consolidated",
        source: "unleash",
      })
    })

    it("records a null arm when not enrolled", async () => {
      mockGetVariant.mockReturnValue(false)
      const ctx = { userID: "123" } as ResolverContext

      await rule.apply(sections, ctx)

      expect(ctx.homeViewAppliedArm).toEqual({ arm: null, source: "unleash" })
    })
  })
})
