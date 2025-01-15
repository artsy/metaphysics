import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("QuickLinks", () => {
  it("returns the section's data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-quick-links") {
            __typename
            internalID
            contextModule
            ownerType
            ... on HomeViewSectionQuickLinks {
              quickLinks {
                title
                href
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
        "__typename": "HomeViewSectionQuickLinks",
        "contextModule": "quickLinks",
        "internalID": "home-view-section-quick-links",
        "ownerType": "quickLinks",
        "quickLinks": [
          {
            "href": "/favorites",
            "title": "Follows",
          },
          {
            "href": "/auctions",
            "title": "Auctions",
          },
          {
            "href": "/favorites/saves",
            "title": "Saves",
          },
          {
            "href": "/collect?price_range=%2A-1000",
            "title": "Art under $1000",
          },
          {
            "href": "/price-database",
            "title": "Price Database",
          },
          {
            "href": "/news",
            "title": "Editorial",
          },
        ],
      }
    `)
  })
})
