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
                      href
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
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["painting","sculpture","photography","prints-and-multiples","work-on-paper","design","drawing","installation","film-and-video","jewelry","performance-art","ceramics","textile-art","mixed-media"]",
                },
              },
              {
                "node": {
                  "entityID": "Movement",
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["contemporary-art","abstract-art","impressionist-and-modern","emerging-art","minimalist-art","street-art","pop-art","post-war","20th-century-art","pre-columbian-art"]",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Size",
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["art-for-small-spaces","art-for-large-spaces","tabletop-sculpture"]",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Color",
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["black-and-white-artworks","warm-toned-artworks","cool-toned-artworks","blue-artworks","red-artworks","neutral-artworks","green-artworks","yellow-artworks","orange-artworks"]",
                },
              },
              {
                "node": {
                  "entityID": "Collect by Price",
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["art-under-500-dollars","art-under-1000-dollars","art-under-2500-dollars","art-under-5000-dollars","art-under-10000-dollars","art-under-25000-dollars","art-under-50000-dollars"]",
                },
              },
              {
                "node": {
                  "entityID": "Gallery",
                  "href": "/collections-by-category/home-view-section-explore-by-category?slugs=["new-from-tastemaking-galleries","new-from-nonprofits-acaf27cc-2d39-4ed3-93dd-d7099e183691","new-from-small-galleries","new-from-leading-galleries","new-to-artsy"]",
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
