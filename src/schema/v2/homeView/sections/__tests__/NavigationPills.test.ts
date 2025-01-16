import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("NavigationPills", () => {
  it("returns the section's data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-navigation-pills") {
            __typename
            internalID
            contextModule
            ownerType
            ... on HomeViewSectionNavigationPills {
              navigationPills {
                title
                href
                ownerType
                contextScreenOwnerId
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
        "internalID": "home-view-section-navigation-pills",
        "navigationPills": [
          {
            "contextScreenOwnerId": null,
            "href": "/favorites",
            "ownerType": "follows",
            "title": "Follows",
          },
          {
            "contextScreenOwnerId": null,
            "href": "/auctions",
            "ownerType": "auctions",
            "title": "Auctions",
          },
          {
            "contextScreenOwnerId": null,
            "href": "/favorites/saves",
            "ownerType": "saves",
            "title": "Saves",
          },
          {
            "contextScreenOwnerId": "/collect?price_range=*-1000",
            "href": "/collect?price_range=%2A-1000",
            "ownerType": "collect",
            "title": "Art under $1000",
          },
          {
            "contextScreenOwnerId": null,
            "href": "/price-database",
            "ownerType": "priceDatabase",
            "title": "Price Database",
          },
          {
            "contextScreenOwnerId": null,
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
