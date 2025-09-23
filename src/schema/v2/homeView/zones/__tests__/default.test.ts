import { ResolverContext } from "types/graphql"
import { getSections } from "../default"

describe("getSections", () => {
  describe("with an authenticated user", () => {
    it("returns the correct sections", async () => {
      const context: Partial<ResolverContext> = {
        accessToken: "some-token",
      }

      const sections = await getSections(context as ResolverContext)
      const sectionIds = sections.map((section) => section.id)

      expect(sectionIds).toMatchInlineSnapshot(`
        [
          "home-view-section-quick-links",
          "home-view-section-tasks",
          "home-view-section-latest-activity",
          "home-view-section-new-works-for-you",
          "home-view-section-recently-viewed-artworks",
          "home-view-section-infinite-discovery",
          "home-view-section-discover-something-new",
          "home-view-section-recommended-artworks",
          "home-view-section-based-on-your-recent-saves",
          "home-view-section-curators-picks-emerging",
          "home-view-section-explore-by-category",
          "home-view-section-hero-units",
          "home-view-section-auction-lots-for-you",
          "home-view-section-auctions",
          "home-view-section-latest-auction-results",
          "home-view-section-galleries-near-you",
          "home-view-section-latest-articles",
          "home-view-section-news",
          "home-view-section-new-works-from-galleries-you-follow",
          "home-view-section-recommended-artists",
          "home-view-section-trending-artists",
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

      const sections = await getSections(context as ResolverContext)
      const sectionIds = sections.map((section) => section.id)

      expect(sectionIds).toMatchInlineSnapshot(`
        [
          "home-view-section-infinite-discovery",
          "home-view-section-discover-something-new",
          "home-view-section-curators-picks-emerging",
          "home-view-section-explore-by-category",
          "home-view-section-hero-units",
          "home-view-section-auctions",
          "home-view-section-galleries-near-you",
          "home-view-section-latest-articles",
          "home-view-section-news",
          "home-view-section-trending-artists",
          "home-view-section-viewing-rooms",
          "home-view-section-featured-fairs",
        ]
      `)
    })
  })

  describe("Auction segmentation", () => {
    describe("for eligible user segments", () => {
      let context: Partial<ResolverContext>

      beforeEach(() => {
        context = {
          accessToken: "some-token",
          auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
            data: [{ auction_segmentation: "engaged" }],
          }),
        }
      })
      it("reorders the sections", async () => {
        const sections = await getSections(context as ResolverContext)
        const sectionIds = sections.map((section) => section.id)

        expect(sectionIds).toMatchInlineSnapshot(`
          [
            "home-view-section-quick-links",
            "home-view-section-tasks",
            "home-view-section-latest-activity",
            "home-view-section-new-works-for-you",
            "home-view-section-auction-lots-for-you",
            "home-view-section-recently-viewed-artworks",
            "home-view-section-infinite-discovery",
            "home-view-section-discover-something-new",
            "home-view-section-recommended-artworks",
            "home-view-section-based-on-your-recent-saves",
            "home-view-section-curators-picks-emerging",
            "home-view-section-explore-by-category",
            "home-view-section-hero-units",
            "home-view-section-auctions",
            "home-view-section-latest-auction-results",
            "home-view-section-galleries-near-you",
            "home-view-section-latest-articles",
            "home-view-section-news",
            "home-view-section-new-works-from-galleries-you-follow",
            "home-view-section-recommended-artists",
            "home-view-section-trending-artists",
            "home-view-section-similar-to-recently-viewed-artworks",
            "home-view-section-viewing-rooms",
            "home-view-section-shows-for-you",
            "home-view-section-featured-fairs",
          ]
        `)
      })
    })

    describe("for ineligible user segments", () => {
      let context: Partial<ResolverContext>

      beforeEach(() => {
        context = {
          accessToken: "some-token",
          auctionUserSegmentationLoader: jest.fn().mockResolvedValue({
            data: [{ auction_segmentation: "disengaged" }],
          }),
        }
      })
      it("does not reorder the sections", async () => {
        const sections = await getSections(context as ResolverContext)
        const sectionIds = sections.map((section) => section.id)

        expect(sectionIds).toMatchInlineSnapshot(`
          [
            "home-view-section-quick-links",
            "home-view-section-tasks",
            "home-view-section-latest-activity",
            "home-view-section-new-works-for-you",
            "home-view-section-recently-viewed-artworks",
            "home-view-section-infinite-discovery",
            "home-view-section-discover-something-new",
            "home-view-section-recommended-artworks",
            "home-view-section-based-on-your-recent-saves",
            "home-view-section-curators-picks-emerging",
            "home-view-section-explore-by-category",
            "home-view-section-hero-units",
            "home-view-section-auction-lots-for-you",
            "home-view-section-auctions",
            "home-view-section-latest-auction-results",
            "home-view-section-galleries-near-you",
            "home-view-section-latest-articles",
            "home-view-section-news",
            "home-view-section-new-works-from-galleries-you-follow",
            "home-view-section-recommended-artists",
            "home-view-section-trending-artists",
            "home-view-section-similar-to-recently-viewed-artworks",
            "home-view-section-viewing-rooms",
            "home-view-section-shows-for-you",
            "home-view-section-featured-fairs",
          ]
        `)
      })
    })
  })
})
