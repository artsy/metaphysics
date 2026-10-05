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
  ] as HomeViewSection[]

  it("returns sections unchanged for control", () => {
    expect(composeForArm("control", sections)).toBe(sections)
  })

  it("returns sections unchanged for null (not enrolled)", () => {
    expect(composeForArm(null, sections)).toBe(sections)
  })

  it("reduces + preserves current order for reduced_current", () => {
    const out = composeForArm("reduced_current", sections)
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      RecommendedArtworks.id,
      CuratorsPicksEmerging.id,
      AuctionLotsForYou.id,
      LatestArticles.id,
      ShowsForYou.id,
      FeaturedFairs.id,
    ])
  })

  it("reorders for hierarchy_breadth", () => {
    const out = composeForArm("hierarchy_breadth", sections)
    expect(out.map((s) => s.id)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      LatestArticles.id,
      News.id,
      ShowsForYou.id,
      FeaturedFairs.id,
      CuratorsPicksEmerging.id,
      TrendingArtists.id,
      RecommendedArtworks.id,
    ])
  })

  it("composes merchandising with the same order as reduced_current", () => {
    expect(composeForArm("merchandising", sections).map((s) => s.id)).toEqual(
      composeForArm("reduced_current", sections).map((s) => s.id)
    )
  })

  it("drops ids present in input but absent from the arm recipe", () => {
    const out = composeForArm("reduced_current", sections)
    expect(out.find((s) => s.id === Tasks.id)).toBeUndefined()
  })

  it("skips arm ids that are not in the (display-filtered) input", () => {
    const out = composeForArm("reduced_current", [
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
