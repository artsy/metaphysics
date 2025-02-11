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
                icon
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
            "icon": "FollowArtistIcon",
            "ownerType": "follows",
            "title": "Follows",
          },
          {
            "href": "/auctions",
            "icon": "AuctionIcon",
            "ownerType": "auctions",
            "title": "Auctions",
          },
          {
            "href": "/favorites/saves",
            "icon": "HeartIcon",
            "ownerType": "saves",
            "title": "Saves",
          },
          {
            "href": "/collect?price_range=%2A-1000",
            "icon": null,
            "ownerType": "collect",
            "title": "Art under $1000",
          },
          {
            "href": "/price-database",
            "icon": null,
            "ownerType": "priceDatabase",
            "title": "Price Database",
          },
          {
            "href": "/news",
            "icon": null,
            "ownerType": "articles",
            "title": "Editorial",
          },
        ],
        "ownerType": "quickLinks",
      }
    `)
  })
})
