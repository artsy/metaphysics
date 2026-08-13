import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import "schema/v2/homeView/experiments/experiments"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

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
              type
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
          "type": "ArtworksGrid",
        },
        "contextModule": "newWorksForYouRail",
        "internalID": "home-view-section-new-works-for-you",
        "ownerType": "newWorksForYou",
        "trackItemImpressions": true,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    // detailed resolver logic is covered in artworksForUser.test.ts
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-for-you") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
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

    const newForYouRecommendations = {
      edges: [
        { node: { artworkId: "608a7417bdfbd1a789ba092a" } },
        { node: { artworkId: "308a7416bdfbd1a789ba0911" } },
      ],
    }

    const artworksResponse = [
      {
        id: "gerhard-richter-test-artwork-1",
        slug: "gerhard-richter-test-artwork-1",
      },
      {
        id: "pablo-picasso-test-artwork-2",
        slug: "pablo-picasso-test-artwork-2",
      },
    ]

    const mockVortexGraphqlLoader = jest.fn(() => () =>
      Promise.resolve({ data: { newForYouRecommendations } })
    )
    const artworksLoader = jest.fn(() => Promise.resolve(artworksResponse))

    const context = {
      accessToken: "424242",
      userID: "user-id",
      artworksLoader,
      setsLoader: jest.fn(() => Promise.resolve({ body: [] })),
      setItemsLoader: jest.fn(() => Promise.resolve({ body: [] })),
      authenticatedLoaders: {
        vortexGraphqlLoader: mockVortexGraphqlLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: jest.fn(),
      },
    } as any

    const { homeView } = await runQuery(query, context)

    expect(artworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
      })
    )

    expect(homeView.section.artworksConnection.edges).toMatchInlineSnapshot(`
      [
        {
          "node": {
            "slug": "gerhard-richter-test-artwork-1",
          },
        },
        {
          "node": {
            "slug": "pablo-picasso-test-artwork-2",
          },
        },
      ]
    `)
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

  // `showArtworksCardView` is deprecated and always false since the
  // onyx_nwfy-artworks-card-test experiment was removed.
  it("does not show the artworks card view", async () => {
    const query = gql`
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

    const context = {
      accessToken: "424242",
      userID: "user-id",
      userAgent: "Artsy-Mobile/8.90.0",
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section.showArtworksCardView).toBe(false)
  })
})
