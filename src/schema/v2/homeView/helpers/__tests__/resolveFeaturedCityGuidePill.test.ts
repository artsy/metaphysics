import moment from "moment"
import { resolveFeaturedCityGuidePill } from "../resolveFeaturedCityGuidePill"
import { FeaturedCityGuide } from "../../sections/featuredCityGuides"

const activeGuide: FeaturedCityGuide = {
  citySlug: "london-united-kingdom",
  title: "London Art Week",
  displayStartAt: moment.utc().subtract(1, "day").toISOString(),
  displayEndAt: moment.utc().add(1, "day").toISOString(),
}

describe("resolveFeaturedCityGuidePill", () => {
  it("returns the featured pill while the guide is active", () => {
    const pill = resolveFeaturedCityGuidePill(activeGuide)

    expect(pill).toMatchObject({
      title: "London Art Week",
      href: "/city-guide?citySlug=london-united-kingdom",
      isFeatured: true,
    })
  })

  describe("outside the guide's window", () => {
    const upcomingGuide: FeaturedCityGuide = {
      ...activeGuide,
      displayStartAt: moment.utc().add(1, "day").toISOString(),
      displayEndAt: moment.utc().add(2, "days").toISOString(),
    }
    const endedGuide: FeaturedCityGuide = {
      ...activeGuide,
      displayStartAt: moment.utc().subtract(2, "days").toISOString(),
      displayEndAt: moment.utc().subtract(1, "day").toISOString(),
    }

    it.each([
      ["before it starts", upcomingGuide],
      ["after it ends", endedGuide],
    ])("returns a generic City Guide pill %s", (_label, guide) => {
      const pill = resolveFeaturedCityGuidePill(guide)

      expect(pill).toMatchObject({
        title: "City Guide",
        href: "/city-guide",
        isFeatured: false,
      })
    })
  })
})
