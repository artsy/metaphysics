import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("LatestActivity", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-latest-activity") {
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
        "__typename": "HomeViewSectionActivity",
        "component": Object {
          "behaviors": Object {
            "viewAll": Object {
              "buttonText": "See All",
              "href": "/notifications",
              "ownerType": "activities",
            },
          },
          "description": null,
          "title": "Latest Activity",
        },
        "contextModule": "activityRail",
        "internalID": "home-view-section-latest-activity",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-latest-activity") {
            ... on HomeViewSectionActivity {
              notificationsConnection(first: 1) {
                edges {
                  node {
                    internalID
                    isUnread
                    createdAt(format: "YYYY")
                    notificationType
                    title
                    message
                    targetHref
                    objectsCount
                  }
                }
              }
            }
          }
        }
      }
    `

    const notificationsResponse = {
      total: 100,
      total_unread: 10,
      total_unseen: 10,
      feed: [
        {
          id: "6303f205b54941000843419a",
          actors: "Works by Damien Hirst",
          message: "8 Works Added",
          status: "unread",
          date: "2022-08-22T21:15:49.000Z",
          object_ids: ["63036fafbe5cfc000cf358e3", "630392514f13a5000b55ecec"],
          objects_count: 2,
          object: {
            artist: {
              id: "damien-hirst",
              _id: "4d8b926a4eb68a1b2c0000ae",
            },
          },
          activity_type: "ArtworkPublishedActivity",
          target_href: "/artist/damien-hirst/works-for-sale",
        },
      ],
    }

    const notificationsFeedLoader = jest.fn(() =>
      Promise.resolve(notificationsResponse)
    )

    const context = {
      accessToken: "424242",
      notificationsFeedLoader,
    }

    const data = await runQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      Object {
        "homeView": Object {
          "section": Object {
            "notificationsConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "createdAt": "2022",
                    "internalID": "6303f205b54941000843419a",
                    "isUnread": true,
                    "message": "8 Works Added",
                    "notificationType": "ARTWORK_PUBLISHED",
                    "objectsCount": 2,
                    "targetHref": "/artist/damien-hirst/works-for-sale",
                    "title": "Works by Damien Hirst",
                  },
                },
              ],
            },
          },
        },
      }
    `)
  })
})
