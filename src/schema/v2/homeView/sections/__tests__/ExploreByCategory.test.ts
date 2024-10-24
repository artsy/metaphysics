import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("ExploreByCategory", () => {
  describe("when the feature flag is enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "diamond_home-view-marketing-collection-categories")
          return true
      })
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
        Object {
          "__typename": "HomeViewSectionCards",
          "component": Object {
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
        Object {
          "cardsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "entityID": "Medium",
                },
              },
              Object {
                "node": Object {
                  "entityID": "Movement",
                },
              },
              Object {
                "node": Object {
                  "entityID": "Collect by Size",
                },
              },
              Object {
                "node": Object {
                  "entityID": "Collect by Color",
                },
              },
              Object {
                "node": Object {
                  "entityID": "Collect by Price",
                },
              },
              Object {
                "node": Object {
                  "entityID": "Gallery",
                },
              },
            ],
          },
        }
      `)
    })
  })

  describe("when the feature flag is disabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "diamond_home-view-marketing-collection-categories")
          return false
      })
    })

    it("throws an error when accessed by id", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-explore-by-category") {
              __typename
              internalID
            }
          }
        }
      `

      const context = {}

      await expect(runQuery(query, context)).rejects.toThrow(
        "Section is not displayable"
      )
    })
  })
})
