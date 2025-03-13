import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("InfiniteDiscovery", () => {
  describe("when the feature flag is enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "diamond_home-view-infinite-discovery") {
          return true
        }
      })
    })

    it("returns the section's metadata", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-infinite-discovery") {
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

      const context = {
        accessToken: "424242",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        {
          "__typename": "HomeViewSectionCard",
          "component": null,
          "contextModule": "infiniteDiscoveryBanner",
          "internalID": "home-view-section-infinite-discovery",
          "ownerType": "infiniteDiscovery",
        }
      `)
    })

    it("returns the section's card data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-infinite-discovery") {
              ... on HomeViewSectionCard {
                card {
                  badgeText
                  title
                  subtitle
                  href
                  image {
                    imageURL
                  }
                  entityType
                  entityID
                }
              }
            }
          }
        }
      `

      const context = {
        accessToken: "424242",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        {
          "card": {
            "badgeText": "New",
            "entityID": "infiniteDiscovery",
            "entityType": "Page",
            "href": null,
            "image": {
              "imageURL": "https://files.artsy.net/images/infinite_disco_large.webp",
            },
            "subtitle": "Effortless discovery, expert curation — find art you love, one swipe at a time.",
            "title": "Discover Daily",
          },
        }
      `)
    })
  })

  describe("when the feature flag is disabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "diamond_home-view-infinite-discovery") {
          return false
        }
      })
    })

    it("throws an error when accessed by id", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-infinite-discovery") {
              __typename
              internalID
            }
          }
        }
      `

      const context = {
        accessToken: "424242",
      }

      await expect(runQuery(query, context)).rejects.toThrow(
        "Section is not displayable"
      )
    })
  })
})
