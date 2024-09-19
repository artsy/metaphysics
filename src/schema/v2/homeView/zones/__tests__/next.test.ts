import { ResolverContext } from "types/graphql"
import { getSections } from "../next"

describe("getSections", () => {
  describe("with an authenticated user", () => {
    it("returns the correct sections", async () => {
      const context: Partial<ResolverContext> = {
        accessToken: "some-token",
      }

      const sections = await getSections(context as ResolverContext)
      const sectionIds = sections.map((section) => section.id)

      expect(sectionIds).toMatchInlineSnapshot(`
        Array [
          "home-view-section-latest-activity",
          "home-view-section-new-works-for-you",
          "home-view-section-active-bids",
          "home-view-section-auction-lots-for-you",
          "home-view-section-latest-auction-results",
          "home-view-section-recommended-artworks",
          "home-view-section-new-works-from-galleries-you-follow",
          "home-view-section-recommended-artists",
          "home-view-section-recently-viewed-artworks",
          "home-view-section-similar-to-recently-viewed-artworks",
          "home-view-section-shows-for-you",
        ]
      `)
    })
  })
})
