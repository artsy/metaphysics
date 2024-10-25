import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("CuratorsPicksEmerging", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-curators-picks-emerging") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
              backgroundImageURL
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
      siteHeroUnitLoader: jest.fn().mockReturnValue({
        app_title: "Curators' Picks Emerging",
        app_description:
          "The best works by rising talents on Artsy, available now.",
        background_image_app_phone_url: "image.jpg",
        background_image_app_tablet_url: "image.jpg",
      }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionArtworks",
        "component": {
          "backgroundImageURL": "image.jpg",
          "behaviors": {
            "viewAll": {
              "buttonText": "Browse All Artworks",
              "href": "/collection/curators-picks-emerging",
              "ownerType": "collection",
            },
          },
          "description": "The best works by rising talents on Artsy, available now.",
          "title": "Curators' Picks Emerging",
        },
        "contextModule": "curatorsPicksEmergingRail",
        "internalID": "home-view-section-curators-picks-emerging",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-curators-picks-emerging") {
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
          }
        }
      }
    `

    const artworks = [
      { _id: "percy", title: "Percy the Cat" },
      { _id: "matt", title: "Matt the Person" },
    ]

    const context = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {
        filterArtworksLoader: jest.fn().mockReturnValue(
          Promise.resolve({
            hits: artworks,
            aggregations: {
              total: {
                value: 2,
              },
            },
          })
        ),
      },
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "artworksConnection": {
          "edges": [
            {
              "node": {
                "id": "QXJ0d29yazpwZXJjeQ==",
                "title": "Percy the Cat",
              },
            },
            {
              "node": {
                "id": "QXJ0d29yazptYXR0",
                "title": "Matt the Person",
              },
            },
          ],
        },
      }
    `)
  })
})
