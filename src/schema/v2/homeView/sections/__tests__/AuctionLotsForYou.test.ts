import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("AuctionLotsForYou", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-auction-lots-for-you") {
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
        "__typename": "HomeViewSectionArtworks",
        "component": Object {
          "behaviors": Object {
            "viewAll": Object {
              "buttonText": "Browse All Artworks",
              "href": null,
              "ownerType": null,
            },
          },
          "description": null,
          "title": "Auction Lots for You",
        },
        "contextModule": "lotsForYouRail",
        "internalID": "home-view-section-auction-lots-for-you",
        "ownerType": "lotsByArtistsYouFollow",
      }
    `)
  })

  it.skip("returns the section's connection data", async () => {
    // see artworksForUser.test.ts
  })
})
