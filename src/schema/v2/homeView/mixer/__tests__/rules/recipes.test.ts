import { HomeViewSection } from "schema/v2/homeView/sections"
import { applyComponentOverride, composeForArm } from "../../rules/recipes"
import { QuickLinks } from "../../../sections/QuickLinks"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { RecommendedArtworks } from "../../../sections/RecommendedArtworks"
import { CuratorsPicksEmerging } from "../../../sections/CuratorsPicksEmerging"
import { AuctionLotsForYou } from "../../../sections/AuctionLotsForYou"
import { TrendingArtists } from "../../../sections/TrendingArtists"
import { LatestArticles } from "../../../sections/LatestArticles"
import { News } from "../../../sections/News"
import { ShowsForYou } from "../../../sections/ShowsForYou"
import { FeaturedFairs } from "../../../sections/FeaturedFairs"
import { Tasks } from "../../../sections/Tasks"
import { CuratedGroup } from "../../../sections/CuratedGroup"
import { EditorialGroup } from "../../../sections/EditorialGroup"
import { WhatsHappeningGroup } from "../../../sections/WhatsHappeningGroup"

describe("composeForArm", () => {
  // A representative superset of the sections the arms reference.
  const sections = [
    QuickLinks,
    Tasks,
    NewWorksForYou,
    RecommendedArtworks,
    CuratorsPicksEmerging,
    AuctionLotsForYou,
    TrendingArtists,
    LatestArticles,
    News,
    ShowsForYou,
    FeaturedFairs,
    CuratedGroup,
    EditorialGroup,
    WhatsHappeningGroup,
  ] as HomeViewSection[]

  // The experiment-only (flag-gated) sections. On the pass-through path these
  // must be stripped so a flag-on "control" variant doesn't leak them into the
  // baseline feed in their default positions.
  const experimentOnlyIds = [
    CuratedGroup.id,
    EditorialGroup.id,
    WhatsHappeningGroup.id,
  ]

  it("returns the baseline feed (experiment-only sections stripped) for control", () => {
    const out = composeForArm("control", sections)
    expect(out.map((s) => s.id)).toEqual(
      sections.filter((s) => !experimentOnlyIds.includes(s.id)).map((s) => s.id)
    )
    experimentOnlyIds.forEach((id) =>
      expect(out.find((s) => s.id === id)).toBeUndefined()
    )
  })

  it("returns the baseline feed (experiment-only sections stripped) for null (not enrolled)", () => {
    const out = composeForArm(null, sections)
    expect(out.map((s) => s.id)).toEqual(
      sections.filter((s) => !experimentOnlyIds.includes(s.id)).map((s) => s.id)
    )
    experimentOnlyIds.forEach((id) =>
      expect(out.find((s) => s.id === id)).toBeUndefined()
    )
  })

  it("reorders for hierarchy_breadth", () => {
    const out = composeForArm("hierarchy_breadth", sections)
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      Tasks.id,
      NewWorksForYou.id,
      EditorialGroup.id,
      WhatsHappeningGroup.id,
      CuratedGroup.id,
      RecommendedArtworks.id,
    ])
  })

  it("drops the standalone rails the section groups consolidate from hierarchy_breadth", () => {
    const out = composeForArm("hierarchy_breadth", sections).map((s) => s.id)
    expect(out).not.toContain(LatestArticles.id)
    expect(out).not.toContain(News.id)
    expect(out).not.toContain(ShowsForYou.id)
    expect(out).not.toContain(FeaturedFairs.id)
  })

  it("drops ids present in input but absent from the arm recipe", () => {
    const out = composeForArm("hierarchy_breadth", sections)
    expect(out.find((s) => s.id === TrendingArtists.id)).toBeUndefined()
  })

  it("skips arm ids that are not in the (display-filtered) input", () => {
    const out = composeForArm("hierarchy_breadth", [
      NewWorksForYou,
    ] as HomeViewSection[])
    expect(out.map((s) => s.id)).toEqual([NewWorksForYou.id])
  })
})

describe("applyComponentOverride", () => {
  it("returns the same instance when no override is given", () => {
    expect(applyComponentOverride(NewWorksForYou, undefined)).toBe(
      NewWorksForYou
    )
  })

  it("overrides component.type without mutating the shared singleton", () => {
    const originalType = NewWorksForYou.component?.type

    const overridden = applyComponentOverride(
      NewWorksForYou,
      "SomeOtherComponent"
    )

    expect(overridden).not.toBe(NewWorksForYou)
    expect(overridden.component).not.toBe(NewWorksForYou.component)
    expect(overridden.component?.type).toEqual("SomeOtherComponent")
    // the module-level singleton is untouched
    expect(NewWorksForYou.component?.type).toEqual(originalType)
  })
})
