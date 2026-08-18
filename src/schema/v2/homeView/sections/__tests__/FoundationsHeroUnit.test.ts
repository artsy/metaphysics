import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("FoundationsHeroUnit", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-foundations-hero-unit") {
            __typename
            internalID
            contextModule
          }
        }
      }
    `

    const { homeView } = await runQuery(query, {})

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionHeroUnits",
        "contextModule": "heroUnitsRail",
        "internalID": "home-view-section-foundations-hero-unit",
      }
    `)
  })

  it("returns only the Foundations hero unit", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-foundations-hero-unit") {
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

    const heroUnitLoader = jest.fn().mockResolvedValue({
      body: {
        id: "613523c3-30ce-49a7-aa21-e617bca1cc7b",
        title: "Foundations 2026",
      },
    })

    const { homeView } = await runQuery(query, { heroUnitLoader })

    expect(heroUnitLoader).toHaveBeenCalledWith(
      "613523c3-30ce-49a7-aa21-e617bca1cc7b"
    )
    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "heroUnitsConnection": {
          "edges": [
            {
              "node": {
                "title": "Foundations 2026",
              },
            },
          ],
        },
      }
    `)
  })

  it("returns an empty connection when the hero unit is missing", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-foundations-hero-unit") {
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

    const heroUnitLoader = jest.fn().mockRejectedValue(new Error("not found"))

    const { homeView } = await runQuery(query, { heroUnitLoader })

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "heroUnitsConnection": {
          "edges": [],
        },
      }
    `)
  })
})
