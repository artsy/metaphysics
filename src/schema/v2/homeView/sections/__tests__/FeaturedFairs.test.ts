import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("FeaturedFairs", () => {
  describe("when the feature flag is enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "onyx_enable-home-view-section-featured-fairs") return true
      })
    })

    it("returns the section's metadata", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-featured-fairs") {
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
          "__typename": "HomeViewSectionFairs",
          "component": {
            "behaviors": null,
            "description": "See works in top art fairs",
            "title": "Featured Fairs",
          },
          "contextModule": "fairRail",
          "internalID": "home-view-section-featured-fairs",
          "ownerType": "featuredFairs",
        }
      `)
    })

    it("returns the section's connection data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-featured-fairs") {
              ... on HomeViewSectionFairs {
                fairsConnection(first: 2) {
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

      const fairs = [
        {
          id: "fair-1",
          name: "Fair 1",
          start_at: "2024-05-23T11:00:00+00:00",
          end_at: "2024-06-23T11:00:00+00:00",
        },
        {
          id: "fair-2",
          name: "Fair 2",
          start_at: "2024-05-23T11:00:00+00:00",
          end_at: "2024-06-23T11:00:00+00:00",
        },
      ]

      const context = {
        fairsLoader: jest.fn().mockResolvedValue({
          body: fairs,
          headers: {},
        }),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        {
          "fairsConnection": {
            "edges": [
              {
                "node": {
                  "name": "Fair 1",
                },
              },
              {
                "node": {
                  "name": "Fair 2",
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
        if (flag === "onyx_enable-home-view-section-featured-fairs")
          return false
      })
    })

    it("throws an error when accessed by id", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-featured-fairs") {
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
