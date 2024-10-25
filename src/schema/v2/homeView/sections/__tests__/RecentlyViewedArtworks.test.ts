import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("RecentlyViewedArtworks", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-recently-viewed-artworks") {
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
          "title": "Recently Viewed",
        },
        "contextModule": "recentlyViewedRail",
        "internalID": "home-view-section-recently-viewed-artworks",
        "ownerType": "recentlyViewed",
      }
    `)
  })

  it.skip("returns the section's connection data", async () => {
    // see recentlyViewedArtworks.test.ts
  })
})
