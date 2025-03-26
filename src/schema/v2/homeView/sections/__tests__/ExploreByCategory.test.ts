import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ExploreByCategory", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-explore-by-category") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
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
          "__typename": "HomeViewSectionCards",
          "component": {
            "behaviors": null,
            "title": "Explore by Category",
          },
          "contextModule": "exploreBy",
          "internalID": "home-view-section-explore-by-category",
          "ownerType": null,
        }
      `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-explore-by-category") {
            ... on HomeViewSectionCards {
              cardsConnection(first: 6) {
                edges {
                  node {
                    entityID
                  }
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
          "cardsConnection": {
            "edges": [
              {
                "node": {
                  "entityID": "Medium",
                },
              },
              {
                "node": {
                  "entityID": "Movement",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Size",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Color",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Price",
                },
              },
              {
                "node": {
                  "entityID": "Gallery",
                },
              },
            ],
          },
        }
      `)
  })
})
