import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("RecommendedArtworks", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-recommended-artworks") {
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

    const context: any = {
      accessToken: "424242",
    }

    const response = await runQuery(query, context)

    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
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
            "title": "We Think You’ll Love",
          },
          "contextModule": "artworkRecommendationsRail",
          "internalID": "home-view-section-recommended-artworks",
          "ownerType": "artworkRecommendations",
          "trackItemImpressions": true,
        },
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-recommended-artworks") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    id
                    title
                  }
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

    const vortexResponse = {
      data: [
        { artwork_id: "608a7417bdfbd1a789ba092a", score: 3.422242962512335 },
        { artwork_id: "308a7416bdfbd1a789ba0911", score: 3.2225049587839654 },
        { artwork_id: "208a7416bdfbd1a789ba0911", score: 4.2225049587839654 },
        { artwork_id: "108a7416bdfbd1a789ba0911", score: 5.2225049587839654 },
      ],
    }

    const vortexArtworkRecommendationsLoader = jest.fn(
      async () => vortexResponse
    )

    const artworksResponse = [
      {
        _id: "608a7417bdfbd1a789ba092a",
        id: "gerhard-richter-abendstimmung-evening-calm-2",
        slug: "gerhard-richter-abendstimmung-evening-calm-2",
      },
      {
        _id: "308a7416bdfbd1a789ba0911",
        id: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
        slug: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
      },
    ]

    const artworksLoader = jest.fn(async () => artworksResponse)

    const context: any = {
      accessToken: "424242",
      artworksLoader,
      userID: "vortex-user-id",
      authenticatedLoaders: { vortexArtworkRecommendationsLoader },
      unauthenticatedLoaders: {},
    }

    const response = await runQuery(query, context)

    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
    })

    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
          "artworksConnection": {
            "edges": [
              {
                "node": {
                  "id": "QXJ0d29yazo2MDhhNzQxN2JkZmJkMWE3ODliYTA5MmE=",
                  "title": "Untitled",
                },
              },
              {
                "node": {
                  "id": "QXJ0d29yazozMDhhNzQxNmJkZmJkMWE3ODliYTA5MTE=",
                  "title": "Untitled",
                },
              },
            ],
          },
          "trackItemImpressions": true,
        },
      }
    `)
  })
})
