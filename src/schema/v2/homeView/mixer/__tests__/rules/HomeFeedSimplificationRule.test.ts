import { HomeViewSection } from "schema/v2/homeView/sections"
import { ResolverContext } from "types/graphql"
import {
  HomeFeedSimplificationRule,
  isEligibleForHomeFeedSimplification,
} from "../../rules/HomeFeedSimplificationRule"
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

  it("does not enroll logged-out viewers (no userID) and skips Unleash", async () => {
    const anonContext = {} as ResolverContext
    expect(await rule.apply(sections, anonContext)).toEqual(sections)
    expect(mockGetVariant).not.toHaveBeenCalled()
    expect(anonContext.homeViewAppliedArm).toEqual({
      arm: null,
      source: "ineligible",
    })
  })

  it("does not enroll Eigen clients below the section-group min version", async () => {
    // Groups require Eigen >= 9.23.0; this client can't render the treatment.
    const oldEigenContext = {
      userID: "123",
      userAgent: "Artsy-Mobile/9.20.0",
    } as ResolverContext

    expect(await rule.apply(sections, oldEigenContext)).toEqual(sections)
    expect(mockGetVariant).not.toHaveBeenCalled()
    expect(oldEigenContext.homeViewAppliedArm).toEqual({
      arm: null,
      source: "ineligible",
    })
  })

  it("enrolls Eigen clients at or above the section-group min version", async () => {
    mockGetVariant.mockReturnValue({ enabled: true, name: "consolidated" })
    const newEigenContext = {
      userID: "123",
      userAgent: "Artsy-Mobile/9.23.0",
    } as ResolverContext

    await rule.apply(sections, newEigenContext)
    expect(mockGetVariant).toHaveBeenCalled()
    expect(newEigenContext.homeViewAppliedArm).toEqual({
      arm: "consolidated",
      source: "unleash",
    })
  })

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

describe("isEligibleForHomeFeedSimplification", () => {
  it("is false for anonymous viewers", () => {
    expect(isEligibleForHomeFeedSimplification({} as ResolverContext)).toBe(
      false
    )
  })

  it("is false for Eigen below the min version", () => {
    expect(
      isEligibleForHomeFeedSimplification({
        userID: "123",
        userAgent: "Artsy-Mobile/9.20.0",
      } as ResolverContext)
    ).toBe(false)
  })

  it("is true for a logged-in, current-version viewer", () => {
    expect(
      isEligibleForHomeFeedSimplification({
        userID: "123",
        userAgent: "Artsy-Mobile/9.23.0",
      } as ResolverContext)
    ).toBe(true)
  })

  it("is true for a logged-in non-Eigen client (no version to gate on)", () => {
    expect(
      isEligibleForHomeFeedSimplification({ userID: "123" } as ResolverContext)
    ).toBe(true)
  })
})
