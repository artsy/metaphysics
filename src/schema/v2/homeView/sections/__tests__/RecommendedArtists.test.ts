import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("RecommendedArtists", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-recommended-artists") {
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
      Object {
        "__typename": "HomeViewSectionArtists",
        "component": Object {
          "behaviors": null,
          "description": null,
          "title": "Recommended Artists",
        },
        "contextModule": "recommendedArtistsRail",
        "internalID": "home-view-section-recommended-artists",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-recommended-artists") {
            ... on HomeViewSectionArtists {
              artistsConnection(first: 2) {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    const mockVortexResponse = {
      data: {
        artistRecommendations: {
          edges: [
            {
              node: {
                artistId: "artist-1",
              },
            },
            {
              node: {
                artistId: "artist-2",
              },
            },
          ],
          totalCount: 2,
        },
      },
    }

    const mockArtistsResponse = {
      body: [
        {
          _id: "artist-1",
          id: "banksy",
          name: "Artist 1",
        },
        {
          _id: "artist-2",
          id: "1-plus-1-plus-1",
          name: "Artist 2",
        },
      ],
    }

    const context = {
      accessToken: "424242",
      authenticatedLoaders: {
        vortexGraphqlLoader: jest.fn(() => async () => mockVortexResponse),
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: jest.fn(() => async () => []),
      },
      artistsLoader: jest.fn().mockReturnValue(mockArtistsResponse),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "artistsConnection": Object {
          "edges": Array [
            Object {
              "node": Object {
                "id": "QXJ0aXN0OmFydGlzdC0x",
                "name": "Artist 1",
              },
            },
            Object {
              "node": Object {
                "id": "QXJ0aXN0OmFydGlzdC0y",
                "name": "Artist 2",
              },
            },
          ],
        },
      }
    `)
  })
})
