import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("TrendingArtists", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-trending-artists") {
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
        "__typename": "HomeViewSectionArtists",
        "component": {
          "behaviors": null,
          "description": null,
          "title": "Trending Artists",
        },
        "contextModule": "trendingArtistsRail",
        "internalID": "home-view-section-trending-artists",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-trending-artists") {
            ... on HomeViewSectionArtists {
              artistsConnection(first: 3) {
                edges {
                  node {
                    slug
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    const filterArtworksResponse = {
      aggregations: {
        merchandisable_artists: {
          "artist-123": 40,
          "artist-456": 20,
        },
      },
    }

    const filterArtworksLoader = jest.fn(async () => filterArtworksResponse)

    const artistsResponse = {
      body: [
        {
          id: "artist-123",
          name: "Artist 123",
        },
        {
          id: "artist-456",
          name: "Artist 456",
        },
      ],
    }

    const artistsLoader = jest.fn(async () => artistsResponse)

    const context: any = {
      filterArtworksLoader,
      artistsLoader,
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "artistsConnection": {
          "edges": [
            {
              "node": {
                "name": "Artist 123",
                "slug": "artist-123",
              },
            },
            {
              "node": {
                "name": "Artist 456",
                "slug": "artist-456",
              },
            },
          ],
        },
      }
    `)
  })
})
