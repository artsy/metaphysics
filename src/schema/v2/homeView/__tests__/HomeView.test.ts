import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

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

    const context = {
      authenticatedLoaders: {
        meLoader: jest.fn().mockReturnValue({ type: "User" }),
      },
      siteHeroUnitLoader: jest.fn().mockReturnValue({
        app_title: "Curators' Picks Emerging",
      }),
    }

    it("returns requested data for each section", async () => {
      const { homeView } = await runQuery(query, context)

      expect(homeView.sectionsConnection).toMatchInlineSnapshot(`
        Object {
          "edges": Array [
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
                "__typename": "ArtworksRailHomeViewSection",
                "component": Object {
                  "title": "Similar to Works You’ve Viewed",
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
                  "title": "Auction lots for you",
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
                  "title": "New Works from Galleries You Follow",
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
          ],
        }
      `)
    })
  })

  describe("section", () => {
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

    const context = {
      authenticatedLoaders: {
        meLoader: jest.fn().mockReturnValue({ type: "User" }),
      },
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
