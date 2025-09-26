import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("SimilarToRecentlyViewed", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-similar-to-recently-viewed-artworks") {
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
          "title": "Similar to Works You’ve Viewed",
        },
        "contextModule": "similarToWorksYouViewedRail",
        "internalID": "home-view-section-similar-to-recently-viewed-artworks",
        "ownerType": "similarToRecentlyViewed",
        "trackItemImpressions": true,
      }
    `)
  })

  it.skip("returns the section's connection data", async () => {
    // see similarToRecentlyViewed.test.ts
  })
})
