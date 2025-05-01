import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import * as featureFlags from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

describe("ExploreByCategory", () => {
  const mockGetExperimentVariant = featureFlags.getExperimentVariant as jest.Mock

  beforeEach(() => {
    mockGetExperimentVariant.mockClear().mockReturnValue(false)
  })

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

  it("is not displayable when user is in variant A of diamond_discover-tab experiment", async () => {
    mockGetExperimentVariant.mockReturnValue({
      name: "variant-a",
      enabled: true,
    })

    const query = gql`
      {
        homeView {
          section(id: "home-view-section-explore-by-category") {
            __typename
          }
        }
      }
    `

    const context = {
      userID: "test-user-id",
    }

    await expect(runQuery(query, context)).rejects.toThrow(
      "Section is not displayable"
    )

    expect(
      mockGetExperimentVariant
    ).toHaveBeenCalledWith("diamond_discover-tab", { userId: "test-user-id" })
  })
})
