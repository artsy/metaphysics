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
            ... on HomeViewSectionArtworks {
              trackItemImpressions
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
        "trackItemImpressions": true,
      }
    `)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("returns the section's connection data", async () => {
    // see artworksForUser.test.ts
  })

  it("serves Version C", async () => {
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

  describe("showArtworksCardView", () => {
    const showArtworksCardViewQuery = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-for-you") {
            ... on HomeViewSectionArtworks {
              showArtworksCardView
            }
          }
        }
      }
    `

    afterEach(() => {
      mockGetExperimentVariant.mockReset()
    })

    it("returns true when variant-a is enabled and user has Eigen 8.90.0+", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "variant-a",
        enabled: true,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
        userAgent: "Artsy-Mobile/8.90.0",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(true)
      expect(mockGetExperimentVariant).toHaveBeenCalledWith(
        "onyx_nwfy-artworks-card-test",
        {
          userId: "user-id",
        }
      )
    })

    it("returns false when in control group", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "control",
        enabled: true,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
        userAgent:
          "unknown iOS/18.1.1 Artsy-Mobile/8.90.0 Eigen/2024.12.10.06/8.90.0",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(false)
    })

    it("returns false when experiment is not enabled", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "variant-a",
        enabled: false,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
        userAgent: "Artsy-Mobile/8.90.0",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(false)
    })

    it("returns false when user has old Eigen version (below 8.90.0)", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "variant-a",
        enabled: true,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
        userAgent: "Artsy-Mobile/8.89.0",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(false)
    })

    it("returns false when user agent is missing", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "variant-a",
        enabled: true,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(false)
    })

    it("returns false when user agent is not Eigen", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "variant-a",
        enabled: true,
      }))

      const context = {
        accessToken: "424242",
        userID: "user-id",
        userAgent: "Mozilla/5.0",
      }

      const { homeView } = await runQuery(showArtworksCardViewQuery, context)

      expect(homeView.section.showArtworksCardView).toBe(false)
    })
  })
})
