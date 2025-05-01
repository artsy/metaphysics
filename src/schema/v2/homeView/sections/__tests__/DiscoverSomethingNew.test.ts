import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import * as featureFlags from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

describe("DiscoverSomethingNew", () => {
  const mockGetExperimentVariant = featureFlags.getExperimentVariant as jest.Mock

  beforeEach(() => {
    mockGetExperimentVariant.mockClear().mockReturnValue(false)
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
        {
          "__typename": "HomeViewSectionCards",
          "component": {
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
            subtitle: "Our Picks",
            thumbnail: "figurative-art.jpg",
          },
          {
            slug: "new-from-leading-galleries",
            id: "new-from-leading-galleries",
            title: "New from Leading Galleries",
            subtitle: "Our Picks",
            thumbnail: "new-from-leading-galleries.jpg",
          },
        ],
      }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
        {
          "cardsConnection": {
            "edges": [
              {
                "node": {
                  "entityID": "figurative-art",
                  "image": {
                    "url": "figurative-art.jpg",
                  },
                  "title": "Figurative Art",
                },
              },
              {
                "node": {
                  "entityID": "new-from-leading-galleries",
                  "image": {
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

  it("is not displayable when user is in variant A of diamond_discover-tab experiment", async () => {
    mockGetExperimentVariant.mockReturnValue({
      name: "variant-a",
      enabled: true,
    })

    const query = gql`
      {
        homeView {
          section(id: "home-view-section-discover-something-new") {
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
