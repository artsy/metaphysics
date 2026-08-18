import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "schema/v2/homeView/sections"
import { NewWorksForYou } from "../../../sections/NewWorksForYou"
import { LatestActivity } from "../../../sections/LatestActivity"
import { Tasks } from "../../../sections/Tasks"
import { FoundationsHeroUnit } from "../../../sections/FoundationsHeroUnit"
import { RecentlyViewedArtworks } from "../../../sections/RecentlyViewedArtworks"
import { QuickLinks } from "../../../sections/QuickLinks"
import { FoundationsHeroUnitRule } from "../FoundationsHeroUnitRule"

const idsOf = (sections: HomeViewSection[]) => sections.map((s) => s.id)

const context = {} as ResolverContext

describe("FoundationsHeroUnitRule", () => {
  it("places FoundationsHeroUnit right after NewWorksForYou", async () => {
    const input = [
      QuickLinks,
      Tasks,
      LatestActivity,
      NewWorksForYou,
      RecentlyViewedArtworks,
      FoundationsHeroUnit,
    ]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      QuickLinks.id,
      Tasks.id,
      LatestActivity.id,
      NewWorksForYou.id,
      FoundationsHeroUnit.id,
      RecentlyViewedArtworks.id,
    ])
  })

  it("falls back to LatestActivity when NewWorksForYou is missing", async () => {
    const input = [
      QuickLinks,
      Tasks,
      LatestActivity,
      RecentlyViewedArtworks,
      FoundationsHeroUnit,
    ]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      QuickLinks.id,
      Tasks.id,
      LatestActivity.id,
      FoundationsHeroUnit.id,
      RecentlyViewedArtworks.id,
    ])
  })

  it("falls back to Tasks when NewWorksForYou and LatestActivity are missing", async () => {
    const input = [
      QuickLinks,
      Tasks,
      RecentlyViewedArtworks,
      FoundationsHeroUnit,
    ]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      QuickLinks.id,
      Tasks.id,
      FoundationsHeroUnit.id,
      RecentlyViewedArtworks.id,
    ])
  })

  it("falls back to QuickLinks when NewWorksForYou, LatestActivity, and Tasks are missing", async () => {
    const input = [QuickLinks, RecentlyViewedArtworks, FoundationsHeroUnit]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      QuickLinks.id,
      FoundationsHeroUnit.id,
      RecentlyViewedArtworks.id,
    ])
  })

  it("puts FoundationsHeroUnit at the top when no anchor is present", async () => {
    const input = [RecentlyViewedArtworks, FoundationsHeroUnit]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      FoundationsHeroUnit.id,
      RecentlyViewedArtworks.id,
    ])
  })

  it("is a no-op when FoundationsHeroUnit is not in the list", async () => {
    const input = [QuickLinks, NewWorksForYou, RecentlyViewedArtworks]

    const result = await new FoundationsHeroUnitRule().apply(input, context)

    expect(idsOf(result)).toEqual([
      QuickLinks.id,
      NewWorksForYou.id,
      RecentlyViewedArtworks.id,
    ])
  })
})
