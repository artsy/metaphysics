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
            "href": "/favorites/saves",
            "icon": "HeartStrokeIcon",
            "ownerType": "saves",
            "title": "Saves",
          },
          {
            "href": "/auctions",
            "icon": "GavelIcon",
            "ownerType": "auctions",
            "title": "Auctions",
          },
          {
            "href": "/collection/new-this-week",
            "icon": null,
            "ownerType": "collection",
            "title": "New This Week",
          },
          {
            "href": "/articles",
            "icon": "PublicationIcon",
            "ownerType": "articles",
            "title": "Editorial",
          },
          {
            "href": "/collection/statement-pieces",
            "icon": null,
            "ownerType": "collection",
            "title": "Statement Pieces",
          },
          {
            "href": "/shows-for-you",
            "icon": null,
            "ownerType": "shows",
            "title": "Shows for You",
          },
        ],
        "ownerType": "quickLinks",
      }
    `)
  })
})
