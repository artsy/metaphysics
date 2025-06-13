import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { getExperimentVariant } from "lib/featureFlags"
import "schema/v2/homeView/experiments/experiments"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

const mockGetExperimentVariant = getExperimentVariant as jest.Mock

describe("NewWorksForYou", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-for-you") {
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

    const context = {
      accessToken: "424242",
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionArtworks",
        "component": {
          "behaviors": {
            "viewAll": {
              "buttonText": "Browse All Artworks",
              "href": null,
              "ownerType": null,
            },
          },
          "description": null,
          "title": "New Works for You",
        },
        "contextModule": "newWorksForYouRail",
        "internalID": "home-view-section-new-works-for-you",
        "ownerType": "newWorksForYou",
      }
    `)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("returns the section's connection data", async () => {
    // see artworksForUser.test.ts
  })

  describe("when the onyx_nwfy-price-affinity-test experiment is enabled", () => {
    it("serves Version C to the control group", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "control",
        enabled: true,
      }))

      const query = gql`
        {
          homeView {
            section(id: "home-view-section-new-works-for-you") {
              ... on HomeViewSectionArtworks {
                artworksConnection(first: 20) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          }
        }
      `

      type VortexGraphqlLoaderArgs = { query: string }
      const mockVortexGraphqlLoader = jest.fn(
        (_args: VortexGraphqlLoaderArgs) => () =>
          Promise.resolve({ data: { newForYouRecommendations: [{}] } })
      )

      const context = {
        accessToken: "424242",
        userID: "vortex-user-id",
        artworksLoader: jest.fn(() => Promise.resolve([])),
        setsLoader: jest.fn(() => Promise.resolve({ body: [] })),
        setItemsLoader: jest.fn(() => Promise.resolve({ body: [{}] })),
        authenticatedLoaders: {
          vortexGraphqlLoader: mockVortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: jest.fn(),
        },
      } as any

      await runQuery(query, context)

      const vortexGraphqlQuery =
        mockVortexGraphqlLoader.mock.calls?.[0]?.[0]?.query

      expect(vortexGraphqlQuery).toMatch('version: "C"')
    })

    it("serves Version A to the experiment group", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "experiment",
        enabled: true,
      }))

      const query = gql`
        {
          homeView {
            section(id: "home-view-section-new-works-for-you") {
              ... on HomeViewSectionArtworks {
                artworksConnection(first: 20) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          }
        }
      `

      type VortexGraphqlLoaderArgs = { query: string }
      const mockVortexGraphqlLoader = jest.fn(
        (_args: VortexGraphqlLoaderArgs) => () =>
          Promise.resolve({ data: { newForYouRecommendations: [{}] } })
      )

      const context = {
        accessToken: "424242",
        userID: "vortex-user-id",
        artworksLoader: jest.fn(() => Promise.resolve([])),
        setsLoader: jest.fn(() => Promise.resolve({ body: [] })),
        setItemsLoader: jest.fn(() => Promise.resolve({ body: [{}] })),
        authenticatedLoaders: {
          vortexGraphqlLoader: mockVortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: jest.fn(),
        },
      } as any

      await runQuery(query, context)

      const vortexGraphqlQuery =
        mockVortexGraphqlLoader.mock.calls?.[0]?.[0]?.query

      expect(vortexGraphqlQuery).toMatch('version: "A"')
    })
  })
})
