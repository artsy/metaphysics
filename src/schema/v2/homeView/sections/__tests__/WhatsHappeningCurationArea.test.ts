import { WhatsHappeningCurationArea } from "../WhatsHappeningCurationArea"
import { FeaturedFairs } from "../FeaturedFairs"
import { ShowsForYou } from "../ShowsForYou"

describe("WhatsHappeningCurationArea", () => {
  it("is a rails-only area consolidating Featured Fairs + Shows", () => {
    expect(WhatsHappeningCurationArea.rails).toEqual([
      { sectionID: FeaturedFairs.id },
      { sectionID: ShowsForYou.id, title: "Shows Near You" },
    ])
  })

  it("has no chips", () => {
    expect(WhatsHappeningCurationArea.chipsTitle).toBeUndefined()
    expect(WhatsHappeningCurationArea.resolver).toBeUndefined()
  })

  it("is gated behind the experiment flag", () => {
    expect(WhatsHappeningCurationArea.featureFlag).toEqual(
      "onyx_home-feed-simplification"
    )
  })

  it("tints its background", () => {
    expect(WhatsHappeningCurationArea.backgroundColor).toEqual("#F7F7F7")
  })
})
