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
            ... on HomeViewSectionNavigationPills {
              navigationPills {
                title
                href
                ownerType
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
        "__typename": "HomeViewSectionNavigationPills",
        "contextModule": "quickLinks",
        "internalID": "home-view-section-quick-links",
        "navigationPills": [
          {
            "href": "/favorites",
            "ownerType": "follows",
            "title": "Follows",
          },
          {
            "href": "/auctions",
            "ownerType": "auctions",
            "title": "Auctions",
          },
          {
            "href": "/favorites/saves",
            "ownerType": "saves",
            "title": "Saves",
          },
          {
            "href": "/collect?price_range=%2A-1000",
            "ownerType": "collect",
            "title": "Art under $1000",
          },
          {
            "href": "/price-database",
            "ownerType": "priceDatabase",
            "title": "Price Database",
          },
          {
            "href": "/news",
            "ownerType": "articles",
            "title": "Editorial",
          },
        ],
        "ownerType": "quickLinks",
      }
    `)
  })
})
