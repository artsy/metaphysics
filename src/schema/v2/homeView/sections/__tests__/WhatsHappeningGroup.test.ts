import { WhatsHappeningGroup } from "../WhatsHappeningGroup"
import { FeaturedFairs } from "../FeaturedFairs"
import { ShowsForYou } from "../ShowsForYou"

describe("WhatsHappeningGroup", () => {
  it("is a rails-only area consolidating Featured Fairs + Shows", () => {
    expect(WhatsHappeningGroup.rails).toEqual([
      { sectionID: FeaturedFairs.id },
      { sectionID: ShowsForYou.id, title: "Shows Near You" },
    ])
  })

  it("has no chips", () => {
    expect(WhatsHappeningGroup.chipsTitle).toBeUndefined()
    expect(WhatsHappeningGroup.resolver).toBeUndefined()
  })

  it("is gated behind the experiment flag", () => {
    expect(WhatsHappeningGroup.featureFlag).toEqual(
      "onyx_home-feed-simplification"
    )
  })

  it("tints its background", () => {
    expect(WhatsHappeningGroup.backgroundColor).toEqual("#F7F7F7")
  })
})
