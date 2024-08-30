import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("homeView", () => {
  describe("sectionsConnection", () => {
    const query = gql`
      {
        homeView {
          sectionsConnection(first: 20) {
            edges {
              node {
                __typename
                ... on GenericHomeViewSection {
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
                  "__typename": "HeroUnitsHomeViewSection",
                  "component": null,
                },
              },
              Object {
                "node": Object {
                  "__typename": "SalesRailHomeViewSection",
                  "component": Object {
                    "title": "Auctions",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "GalleriesHomeViewSection",
                  "component": Object {
                    "title": "Galleries Near You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArticlesRailHomeViewSection",
                  "component": Object {
                    "title": "Artsy Editorial",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArticlesRailHomeViewSection",
                  "component": Object {
                    "title": "News",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "MarketingCollectionsRailHomeViewSection",
                  "component": Object {
                    "title": "Collections",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtistsRailHomeViewSection",
                  "component": Object {
                    "title": "Trending Artists on Artsy",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ViewingRoomsRailHomeViewSection",
                  "component": Object {
                    "title": "Viewing Rooms",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "FairsRailHomeViewSection",
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
                  "__typename": "ActivityRailHomeViewSection",
                  "component": Object {
                    "title": "Latest Activity",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "New works for you",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "HeroUnitsHomeViewSection",
                  "component": null,
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Your Active Bids",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Auction lots for you",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "SalesRailHomeViewSection",
                  "component": Object {
                    "title": "Auctions",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "AuctionResultsRailHomeViewSection",
                  "component": Object {
                    "title": "Latest Auction Results",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "GalleriesHomeViewSection",
                  "component": Object {
                    "title": "Galleries Near You",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArticlesRailHomeViewSection",
                  "component": Object {
                    "title": "Artsy Editorial",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArticlesRailHomeViewSection",
                  "component": Object {
                    "title": "News",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Curators' Picks Emerging",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "MarketingCollectionsRailHomeViewSection",
                  "component": Object {
                    "title": "Collections",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Artwork Recommendations",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "New Works from Galleries You Follow",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtistsRailHomeViewSection",
                  "component": Object {
                    "title": "Recommended Artists",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtistsRailHomeViewSection",
                  "component": Object {
                    "title": "Trending Artists on Artsy",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Recently viewed works",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ArtworksRailHomeViewSection",
                  "component": Object {
                    "title": "Similar to Works You’ve Viewed",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ViewingRoomsRailHomeViewSection",
                  "component": Object {
                    "title": "Viewing Rooms",
                  },
                },
              },
              Object {
                "node": Object {
                  "__typename": "ShowsRailHomeViewSection",
                  "component": Object {
                    "title": "Shows for You",
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
              ... on GenericHomeViewSection {
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

        it("throws an error", async () => {
          await expect(runQuery(query, context)).rejects.toThrow(
            "Section requires authenticated user"
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
                        "__typename": "ArtworksRailHomeViewSection",
                        "component": Object {
                          "title": "Auction lots for you",
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
              ... on GenericHomeViewSection {
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
              "__typename": "ArticlesRailHomeViewSection",
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
              "__typename": "ArticlesRailHomeViewSection",
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
