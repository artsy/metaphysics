import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("DiscoverSomethingNew", () => {
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
            section(id: "home-view-section-discover-something-new") {
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
            "title": "Discover Something New",
          },
          "contextModule": "discoverSomethingNewRail",
          "internalID": "home-view-section-discover-something-new",
          "ownerType": null,
        }
      `)
    })

    it("returns the section's connection data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-discover-something-new") {
              ... on HomeViewSectionCards {
                cardsConnection(first: 6) {
                  edges {
                    node {
                      entityID
                      title
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const context = {
        marketingCollectionsLoader: jest.fn().mockResolvedValue({
          body: [
            {
              slug: "figurative-art",
              id: "figurative-art",
              title: "Figurative Art",
              thumbnail: "figurative-art.jpg",
            },
            {
              slug: "new-from-leading-galleries",
              id: "new-from-leading-galleries",
              title: "New from Leading Galleries",
              thumbnail: "new-from-leading-galleries.jpg",
            },
          ],
        }),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "cardsConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "entityID": "figurative-art",
                  "image": Object {
                    "url": "figurative-art.jpg",
                  },
                  "title": "Figurative Art",
                },
              },
              Object {
                "node": Object {
                  "entityID": "new-from-leading-galleries",
                  "image": Object {
                    "url": "new-from-leading-galleries.jpg",
                  },
                  "title": "New from Leading Galleries",
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
            section(id: "home-view-section-discover-something-new") {
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
