import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ViewingRooms", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-viewing-rooms") {
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

    const context = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionViewingRooms",
        "component": {
          "behaviors": {
            "viewAll": {
              "buttonText": null,
              "href": "/viewing-rooms",
              "ownerType": "viewingRooms",
            },
          },
          "description": null,
          "title": "Viewing Rooms",
        },
        "contextModule": "featuredViewingRoomsRail",
        "internalID": "home-view-section-viewing-rooms",
        "ownerType": null,
      }
    `)
  })

  it.skip("returns the section's connection data", async () => {
    // not fully migrated
  })
})
