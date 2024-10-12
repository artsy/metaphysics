import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn((flag: string) => {
    return [
      "onyx_enable-home-view-section-featured-fairs",
      "diamond_home-view-marketing-collection-categories",
    ].includes(flag)
  }),
}))

describe("homeView", () => {
  describe("sectionsConnection", () => {
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
          Object {
            "edges": Array [
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCards",
                  "component": Object {
                    "title": "Discover Something New",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionHeroUnits",
                  "component": null,
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCards",
                  "component": Object {
                    "title": "Explore by Category",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionSales",
                  "component": Object {
                    "title": "Auctions",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCard",
                  "component": Object {
                    "title": "Galleries near You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArticles",
                  "component": Object {
                    "title": "Artsy Editorial",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArticles",
                  "component": Object {
                    "title": "News",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionMarketingCollections",
                  "component": Object {
                    "title": "Collections",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtists",
                  "component": Object {
                    "title": "Trending Artists",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": Object {
                    "title": "Viewing Rooms",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionFairs",
                  "component": Object {
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
          Object {
            "edges": Array [
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionActivity",
                  "component": Object {
                    "title": "Latest Activity",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "New Works for You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCards",
                  "component": Object {
                    "title": "Discover Something New",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionHeroUnits",
                  "component": null,
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCards",
                  "component": Object {
                    "title": "Explore by Category",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Your Active Bids",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Auction Lots for You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionSales",
                  "component": Object {
                    "title": "Auctions",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionAuctionResults",
                  "component": Object {
                    "title": "Latest Auction Results",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionCard",
                  "component": Object {
                    "title": "Galleries near You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArticles",
                  "component": Object {
                    "title": "Artsy Editorial",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArticles",
                  "component": Object {
                    "title": "News",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionMarketingCollections",
                  "component": Object {
                    "title": "Collections",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Artwork Recommendations",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "New Works from Galleries You Follow",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtists",
                  "component": Object {
                    "title": "Recommended Artists",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtists",
                  "component": Object {
                    "title": "Trending Artists",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Recently Viewed",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionArtworks",
                  "component": Object {
                    "title": "Similar to Works You’ve Viewed",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": Object {
                    "title": "Viewing Rooms",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionShows",
                  "component": Object {
                    "title": "Shows for You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HomeViewSectionFairs",
                  "component": Object {
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
                      Object {
                        "__typename": "HomeViewSectionArtworks",
                        "component": Object {
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
            Object {
              "__typename": "HomeViewSectionArticles",
              "component": Object {
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
            Object {
              "__typename": "HomeViewSectionArticles",
              "component": Object {
                "title": "News",
              },
            }
          `)
        })
      })
    })
  })
})
