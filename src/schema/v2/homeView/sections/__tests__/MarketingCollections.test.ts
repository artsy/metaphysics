import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("MarketingCollections", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-marketing-collections") {
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
        "__typename": "HomeViewSectionMarketingCollections",
        "component": {
          "behaviors": null,
          "description": null,
          "title": "Collections",
        },
        "contextModule": "collectionRail",
        "internalID": "home-view-section-marketing-collections",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-marketing-collections") {
            ... on HomeViewSectionMarketingCollections {
              marketingCollectionsConnection(first: 2) {
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

    const collections = {
      body: [
        {
          title: "Trending Now",
        },
        {
          title: "Top Auction Works",
        },
      ],
    }

    const context = {
      marketingCollectionsLoader: jest.fn().mockResolvedValue(collections),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "marketingCollectionsConnection": {
          "edges": [
            {
              "node": {
                "title": "Trending Now",
              },
            },
            {
              "node": {
                "title": "Top Auction Works",
              },
            },
          ],
        },
      }
    `)
  })
})
