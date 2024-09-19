import { ResolverContext } from "types/graphql"
import { getSections } from "../discovery"

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
          "home-view-section-hero-units",
          "home-view-section-auctions",
          "home-view-section-galleries-near-you",
          "home-view-section-latest-articles",
          "home-view-section-news",
          "home-view-section-curators-picks-emerging",
          "home-view-section-marketing-collections",
          "home-view-section-trending-artists",
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

      const sections = await getSections(context as ResolverContext)
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
