import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("HeroUnits", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-hero-units") {
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
        "__typename": "HomeViewSectionHeroUnits",
        "component": null,
        "contextModule": "heroUnitsRail",
        "internalID": "home-view-section-hero-units",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-hero-units") {
            ... on HomeViewSectionHeroUnits {
              heroUnitsConnection(first: 2) {
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

    const mockHeroUnitsResponse = {
      body: [
        {
          title: "Foundations Summer 2024",
        },
        {
          title: "Foundations Prize Finalists",
        },
      ],
      headers: { "x-total-count": 2 },
    }

    const context = {
      heroUnitsLoader: jest.fn().mockReturnValue(mockHeroUnitsResponse),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "heroUnitsConnection": {
          "edges": [
            {
              "node": {
                "title": "Foundations Summer 2024",
              },
            },
            {
              "node": {
                "title": "Foundations Prize Finalists",
              },
            },
          ],
        },
      }
    `)
  })
})
