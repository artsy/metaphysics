import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ActiveBids", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-active-bids") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
              behaviors {
                viewAll {
                  buttonText
                  href
                  ownerType
                }
              }
            }
          }
        }
      }
    `

    const context = {
      accessToken: "424242",
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "__typename": "HomeViewSectionArtworks",
        "component": Object {
          "behaviors": null,
          "description": null,
          "title": "Your Active Bids",
        },
        "contextModule": "yourActiveBids",
        "internalID": "home-view-section-active-bids",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-active-bids") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const lots = [
      {
        sale_artwork: {
          artwork: {
            title: "Artwork 1",
          },
        },
      },
      {
        sale_artwork: {
          artwork: {
            title: "Artwork 2",
          },
        },
      },
    ]

    const context = {
      accessToken: "424242",
      lotStandingLoader: jest.fn().mockResolvedValue(lots),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "artworksConnection": Object {
          "edges": Array [
            Object {
              "node": Object {
                "title": "Artwork 1",
              },
            },
            Object {
              "node": Object {
                "title": "Artwork 2",
              },
            },
          ],
        },
      }
    `)
  })
})
