import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

describe("Auctions", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-auctions") {
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

    const context = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionSales",
        "component": {
          "behaviors": {
            "viewAll": {
              "buttonText": "Browse All Auctions",
              "href": "/auctions",
              "ownerType": "auctions",
            },
          },
          "description": null,
          "title": "Discover Auctions on Artsy",
        },
        "contextModule": "auctionRail",
        "internalID": "home-view-section-auctions",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-auctions") {
            ... on HomeViewSectionSales {
              salesConnection(first: 2) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    const sales = [
      {
        name: "Auction 1",
      },
      {
        name: "Auction 2",
      },
    ]

    const context = {
      salesLoader: jest.fn().mockResolvedValue(sales),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "salesConnection": {
          "edges": [
            {
              "node": {
                "name": "Auction 1",
              },
            },
            {
              "node": {
                "name": "Auction 2",
              },
            },
          ],
        },
      }
    `)
  })

  it("batches representativeArtworks across the page into one artworksLoader call", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-auctions") {
            ... on HomeViewSectionSales {
              salesConnection(first: 10) {
                edges {
                  node {
                    representativeArtworks {
                      internalID
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const sales = [
      { name: "Auction 1", representative_artwork_ids: ["a1", "a2"] },
      { name: "Auction 2", representative_artwork_ids: ["a3"] },
    ]

    const artworksLoader = jest.fn(({ ids }) =>
      Promise.resolve(ids.map((id: string) => ({ _id: id, id })))
    )

    const context = {
      salesLoader: jest.fn().mockResolvedValue(sales),
      artworksLoader,
    }

    const { homeView } = await runQuery(query, context)

    expect(artworksLoader).toHaveBeenCalledTimes(1)
    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["a1", "a2", "a3"],
      batched: true,
    })

    const nodes = homeView.section.salesConnection.edges.map((e) => e.node)
    expect(nodes[0].representativeArtworks.map((a) => a.internalID)).toEqual([
      "a1",
      "a2",
    ])
    expect(nodes[1].representativeArtworks.map((a) => a.internalID)).toEqual([
      "a3",
    ])
  })
})
