import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { createArtworkByIDLoader } from "lib/loaders/batchArtworkByIDLoader"

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

  const repArtworksQuery = gql`
    {
      homeView {
        section(id: "home-view-section-auctions") {
          ... on HomeViewSectionSales {
            salesConnection(first: 10) {
              edges {
                node {
                  name
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

  it("resolves representativeArtworks across the page in one /artworks call", async () => {
    const artworksLoader = jest.fn(({ ids }) =>
      Promise.resolve(ids.map((id: string) => ({ _id: id })))
    )

    const context = {
      salesLoader: jest.fn().mockResolvedValue(sales),
      artworkByIDLoader: createArtworkByIDLoader(artworksLoader),
    }

    const { homeView } = await runQuery(repArtworksQuery, context)

    // DataLoader coalesces every node's ids into a single batched call.
    expect(artworksLoader).toHaveBeenCalledTimes(1)
    expect(artworksLoader.mock.calls[0][0].ids.sort()).toEqual([
      "a1",
      "a2",
      "a3",
    ])

    const nodes = homeView.section.salesConnection.edges.map((e) => e.node)
    expect(nodes[0].representativeArtworks.map((a) => a.internalID)).toEqual([
      "a1",
      "a2",
    ])
    expect(nodes[1].representativeArtworks.map((a) => a.internalID)).toEqual([
      "a3",
    ])
  })

  it("does not load any artworks when representativeArtworks is not selected", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-auctions") {
            ... on HomeViewSectionSales {
              salesConnection(first: 10) {
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

    const artworksLoader = jest.fn()

    const context = {
      salesLoader: jest.fn().mockResolvedValue(sales),
      artworkByIDLoader: createArtworkByIDLoader(artworksLoader),
    }

    await runQuery(query, context)

    expect(artworksLoader).not.toHaveBeenCalled()
  })

  it("still returns the sales when the artworks load fails", async () => {
    const context = {
      salesLoader: jest.fn().mockResolvedValue(sales),
      artworkByIDLoader: createArtworkByIDLoader(
        jest.fn().mockRejectedValue(new Error("gravity down"))
      ),
    }

    const { homeView } = await runQuery(repArtworksQuery, context)

    const nodes = homeView.section.salesConnection.edges.map((e) => e.node)
    expect(nodes.map((n) => n.name)).toEqual(["Auction 1", "Auction 2"])
    expect(nodes[0].representativeArtworks).toEqual([])
  })
})
