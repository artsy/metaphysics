import { isFeatureFlagEnabled } from "lib/featureFlags"
import { ResolverContext } from "types/graphql"
import { getSections } from "../default"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

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

  describe("FeaturedFairs section", () => {
    describe("when the feature flag is enabled", () => {
      beforeEach(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "onyx_enable-home-view-section-featured-fairs")
            return true
        })
      })

      it("returns the section", async () => {
        const context: Partial<ResolverContext> = {}
        const sections = await getSections(context as ResolverContext)
        const sectionIds = sections.map((section) => section.id)

        expect(sectionIds).toInclude("home-view-section-featured-fairs")
      })
    })

    describe("when the feature flag is not enabled", () => {
      beforeEach(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "onyx_enable-home-view-section-featured-fairs")
            return false
        })
      })

      it("does not return the section", async () => {
        const context: Partial<ResolverContext> = {}
        const sections = await getSections(context as ResolverContext)
        const sectionIds = sections.map((section) => section.id)

        expect(sectionIds).not.toInclude("home-view-section-featured-fairs")
      })
    })
  })

  describe("Auction segmentation", () => {
    describe("when the feature flag is enabled", () => {
      beforeEach(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "onyx_enable-home-view-mixer") return true
          if (flag === "onyx_enable-home-view-auction-segmentation") return true
          return false
        })
      })

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
            ]
          `)
        })
      })
    })

    describe("when the feature flag is not enabled", () => {
      beforeEach(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "onyx_enable-home-view-mixer") return true
          if (flag === "onyx_enable-home-view-auction-segmentation")
            return false
          return false
        })
      })

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
            ]
          `)
        })
      })
    })
  })
})
