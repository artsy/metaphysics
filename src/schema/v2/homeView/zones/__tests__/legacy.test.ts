import { ResolverContext } from "types/graphql"
import { getLegacyZoneSections } from "../legacy"

describe("getLegacyZoneSections", () => {
  describe("with an authenticated user", () => {
    it("returns the correct sections", async () => {
      const context: Partial<ResolverContext> = {
        accessToken: "some-token",
      }

      const sections = await getLegacyZoneSections(context as ResolverContext)
      const sectionIds = sections.map((section) => section.id)

      expect(sectionIds).toMatchInlineSnapshot(`
        Array [
          "home-view-section-latest-activity",
          "home-view-section-new-works-for-you",
          "home-view-section-hero-units",
          "home-view-section-active-bids",
          "home-view-section-auction-lots-for-you",
          "home-view-section-auctions",
          "home-view-section-latest-auction-results",
          "home-view-section-galleries-near-you",
          "home-view-section-latest-articles",
          "home-view-section-news",
          "home-view-section-curators-picks-emerging",
          "home-view-section-marketing-collections",
          "home-view-section-recommended-artworks",
          "home-view-section-new-works-from-galleries-you-follow",
          "home-view-section-recommended-artists",
          "home-view-section-trending-artists",
          "home-view-section-recently-viewed-artworks",
          "home-view-section-similar-to-recently-viewed-artworks",
          "home-view-section-viewing-rooms",
          "home-view-section-shows-for-you",
          "home-view-section-featured-fairs",
        ]
      `)
    })
  })

  describe("without an authenticated user", () => {
    it("returns the correct sections", async () => {
      const context: Partial<ResolverContext> = {
        accessToken: undefined,
      }

      const sections = await getLegacyZoneSections(context as ResolverContext)
      const sectionIds = sections.map((section) => section.id)

      expect(sectionIds).toMatchInlineSnapshot(`
        Array [
          "home-view-section-hero-units",
          "home-view-section-auctions",
          "home-view-section-galleries-near-you",
          "home-view-section-latest-articles",
          "home-view-section-news",
          "home-view-section-curators-picks-emerging",
          "home-view-section-marketing-collections",
          "home-view-section-trending-artists",
          "home-view-section-viewing-rooms",
          "home-view-section-featured-fairs",
        ]
      `)
    })
  })
})
