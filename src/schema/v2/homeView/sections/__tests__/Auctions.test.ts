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
})
