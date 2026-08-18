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

  it("filters out the Foundations hero unit", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-hero-units") {
            ... on HomeViewSectionHeroUnits {
              heroUnitsConnection(first: 5) {
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
          id: "613523c3-30ce-49a7-aa21-e617bca1cc7b",
          title: "Foundations 2026",
        },
        {
          id: "new-to-artsy",
          title: "New to Artsy",
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
                "title": "New to Artsy",
              },
            },
          ],
        },
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
          id: "some-other-hero-unit",
          title: "Foundations Summer 2024",
        },
        {
          id: "another-hero-unit",
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
