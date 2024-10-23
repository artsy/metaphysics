import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { isFeatureFlagEnabled } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("homeView", () => {
  describe("sectionsConnection", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        return [
          "onyx_enable-home-view-section-featured-fairs",
          "diamond_home-view-marketing-collection-categories",
        ].includes(flag)
      })
    })

    const query = gql`
      {
        homeView {
          sectionsConnection(first: 30) {
            edges {
              node {
                __typename
                ... on HomeViewSectionGeneric {
                  component {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    describe("with an unauthenticated user", () => {
      const context: Partial<ResolverContext> = {
        siteHeroUnitLoader: jest.fn().mockReturnValue({
          app_title: "Curators' Picks Emerging",
        }),
      }

      it("returns the correct sections", async () => {
        const { homeView } = await runQuery(query, context)

        expect(homeView.sectionsConnection).toMatchInlineSnapshot(`
          {
            "edges": [
              {
                "node": {
                  "__typename": "HomeViewSectionCards",
                  "component": {
                    "title": "Discover Something New",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionHeroUnits",
                  "component": null,
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionCards",
                  "component": {
                    "title": "Explore by Category",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionSales",
                  "component": {
                    "title": "Auctions",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionCard",
                  "component": {
                    "title": "Galleries near You",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArticles",
                  "component": {
                    "title": "Artsy Editorial",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArticles",
                  "component": {
                    "title": "News",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionMarketingCollections",
                  "component": {
                    "title": "Collections",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtists",
                  "component": {
                    "title": "Trending Artists",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": {
                    "title": "Viewing Rooms",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionFairs",
                  "component": {
                    "title": "Featured Fairs",
                  },
                },
              },
            ],
          }
        `)
      })
    })

    describe("with an authenticated user", () => {
      const context: Partial<ResolverContext> = {
        accessToken: "424242",
        siteHeroUnitLoader: jest.fn().mockReturnValue({
          app_title: "Curators' Picks Emerging",
        }),
      }

      it("returns the correct sections", async () => {
        const { homeView } = await runQuery(query, context)

        expect(homeView.sectionsConnection).toMatchInlineSnapshot(`
          {
            "edges": [
              {
                "node": {
                  "__typename": "HomeViewSectionActivity",
                  "component": {
                    "title": "Latest Activity",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "New Works for You",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionCards",
                  "component": {
                    "title": "Discover Something New",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionHeroUnits",
                  "component": null,
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionCards",
                  "component": {
                    "title": "Explore by Category",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Your Active Bids",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Auction Lots for You",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionSales",
                  "component": {
                    "title": "Auctions",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionAuctionResults",
                  "component": {
                    "title": "Latest Auction Results",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionCard",
                  "component": {
                    "title": "Galleries near You",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArticles",
                  "component": {
                    "title": "Artsy Editorial",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArticles",
                  "component": {
                    "title": "News",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionMarketingCollections",
                  "component": {
                    "title": "Collections",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Artwork Recommendations",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "New Works from Galleries You Follow",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtists",
                  "component": {
                    "title": "Recommended Artists",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtists",
                  "component": {
                    "title": "Trending Artists",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Recently Viewed",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionArtworks",
                  "component": {
                    "title": "Similar to Works You’ve Viewed",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": {
                    "title": "Viewing Rooms",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionShows",
                  "component": {
                    "title": "Shows for You",
                  },
                },
              },
              {
                "node": {
                  "__typename": "HomeViewSectionFairs",
                  "component": {
                    "title": "Featured Fairs",
                  },
                },
              },
            ],
          }
        `)
      })
    })
  })

  describe("section", () => {
    describe("with a section that requires authentication", () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-auction-lots-for-you") {
              __typename
              ... on HomeViewSectionGeneric {
                component {
                  title
                }
              }
            }
          }
        }
      `

      describe("with an unauthenticated user", () => {
        const context: Partial<ResolverContext> = {}

        it("throws an error when accessed by id", async () => {
          await expect(runQuery(query, context)).rejects.toThrow(
            "Section is not displayable"
          )
        })
      })

      describe("with an authenticated user", () => {
        const context: Partial<ResolverContext> = {
          accessToken: "424242",
        }

        it("returns the requested section", async () => {
          const { homeView } = await runQuery(query, context)

          expect(homeView.section).toMatchInlineSnapshot(`
            {
              "__typename": "HomeViewSectionArtworks",
              "component": {
                "title": "Auction Lots for You",
              },
            }
          `)
        })
      })
    })

    describe("with a section that does not require authentication", () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-news") {
              __typename
              ... on HomeViewSectionGeneric {
                component {
                  title
                }
              }
            }
          }
        }
      `

      describe("with an unauthenticated user", () => {
        const context: Partial<ResolverContext> = {}

        it("returns the requested section", async () => {
          const { homeView } = await runQuery(query, context)

          expect(homeView.section).toMatchInlineSnapshot(`
            {
              "__typename": "HomeViewSectionArticles",
              "component": {
                "title": "News",
              },
            }
          `)
        })
      })

      describe("with an authenticated user", () => {
        const context: Partial<ResolverContext> = {
          accessToken: "424242",
        }

        it("returns the requested section", async () => {
          const { homeView } = await runQuery(query, context)

          expect(homeView.section).toMatchInlineSnapshot(`
            {
              "__typename": "HomeViewSectionArticles",
              "component": {
                "title": "News",
              },
            }
          `)
        })
      })
    })
  })
})
