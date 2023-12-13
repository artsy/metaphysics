import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("NotificationItem", () => {
  const notificationPayload = {
    id: "user-notification-id",
    actor_ids: ["actor-id"],
    object_ids: ["object-id1"],
  }
  let meNotificationLoader

  const meLoader = jest.fn(() => Promise.resolve({ id: "user-id" }))

  afterEach(() => {
    meLoader.mockClear()
    meNotificationLoader.mockClear()
  })

  describe('for "ArtworkPublishedNotificationItem"', () => {
    const artistsLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "artist-id",
            name: "Catty Artist",
          },
        ],
      })
    )
    const artworksLoader = jest.fn(() =>
      Promise.resolve([
        {
          id: "artwork-id",
          title: "Catty Artwork",
        },
      ])
    )

    beforeEach(() => {
      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "ArtworkPublishedActivity",
        })
      )
    })

    it("returns data", async () => {
      const query = gql`
        {
          me {
            notification(id: "user-notification-id") {
              item {
                __typename
                ... on ArtworkPublishedNotificationItem {
                  artists {
                    name
                  }
                  artworksConnection(first: 5) {
                    edges {
                      node {
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        meNotificationLoader,
        meLoader,
        artistsLoader,
        artworksLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "notification": Object {
              "item": Object {
                "__typename": "ArtworkPublishedNotificationItem",
                "artists": Array [
                  Object {
                    "name": "Catty Artist",
                  },
                ],
                "artworksConnection": Object {
                  "edges": Array [
                    Object {
                      "node": Object {
                        "title": "Catty Artwork",
                      },
                    },
                  ],
                },
              },
            },
          },
        }
      `)
    })
  })

  describe('for "AlertNotificationItem"', () => {
    const meSearchCriteriaLoader = jest.fn(() =>
      Promise.resolve({
        id: "search-criteria-id",
      })
    )
    const artworksLoader = jest.fn(() =>
      Promise.resolve([
        {
          id: "artwork-id",
          title: "Catty Artwork",
        },
      ])
    )

    beforeEach(() => {
      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "SavedSearchHitActivity",
        })
      )
    })

    it("returns data", async () => {
      const query = gql`
        {
          me {
            notification(id: "user-notification-id") {
              item {
                __typename
                ... on AlertNotificationItem {
                  alert {
                    internalID
                  }
                  artworksConnection(first: 5) {
                    edges {
                      node {
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        meNotificationLoader,
        meLoader,
        meSearchCriteriaLoader,
        artworksLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "notification": Object {
              "item": Object {
                "__typename": "AlertNotificationItem",
                "alert": Object {
                  "internalID": "search-criteria-id",
                },
                "artworksConnection": Object {
                  "edges": Array [
                    Object {
                      "node": Object {
                        "title": "Catty Artwork",
                      },
                    },
                  ],
                },
              },
            },
          },
        }
      `)
    })
  })

  describe('for "ArticleFeaturedArtistNotificationItem"', () => {
    const articleLoader = jest.fn(() =>
      Promise.resolve({
        id: "article-id",
      })
    )
    const artistsLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "artist-id",
            name: "Catty Artist",
          },
        ],
      })
    )

    beforeEach(() => {
      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "ArticleFeaturedArtistActivity",
        })
      )
    })

    it("returns data", async () => {
      const query = gql`
        {
          me {
            notification(id: "user-notification-id") {
              item {
                __typename
                ... on ArticleFeaturedArtistNotificationItem {
                  article {
                    internalID
                  }
                  artistsConnection(first: 5) {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        meNotificationLoader,
        meLoader,
        articleLoader,
        artistsLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "notification": Object {
              "item": Object {
                "__typename": "ArticleFeaturedArtistNotificationItem",
                "article": Object {
                  "internalID": "article-id",
                },
                "artistsConnection": Object {
                  "edges": Array [
                    Object {
                      "node": Object {
                        "name": "Catty Artist",
                      },
                    },
                  ],
                },
              },
            },
          },
        }
      `)
    })
  })

  describe('for "ShowOpenedNotificationItem"', () => {
    const partnerLoader = jest.fn(() =>
      Promise.resolve({
        _id: "partner-id",
      })
    )
    const showsLoader = jest.fn(() =>
      Promise.resolve([
        {
          id: "artist-id",
          name: "Catty Artist",
        },
      ])
    )

    beforeEach(() => {
      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "PartnerShowOpenedActivity",
        })
      )
    })

    it("returns data", async () => {
      const query = gql`
        {
          me {
            notification(id: "user-notification-id") {
              item {
                __typename
                ... on ShowOpenedNotificationItem {
                  partner {
                    internalID
                  }
                  showsConnection(first: 5) {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        meNotificationLoader,
        meLoader,
        partnerLoader,
        showsLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "notification": Object {
              "item": Object {
                "__typename": "ShowOpenedNotificationItem",
                "partner": Object {
                  "internalID": "partner-id",
                },
                "showsConnection": Object {
                  "edges": Array [
                    Object {
                      "node": Object {
                        "name": "Catty Artist",
                      },
                    },
                  ],
                },
              },
            },
          },
        }
      `)
    })
  })

  describe('for "ViewingRoomPublishedNotificationItem"', () => {
    const partnerLoader = jest.fn(() =>
      Promise.resolve({
        _id: "partner-id",
      })
    )

    beforeEach(() => {
      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "ViewingRoomPublishedActivity",
          object_ids: ["viewing-room-id"],
        })
      )
    })

    it("returns data", async () => {
      const query = gql`
        {
          me {
            notification(id: "user-notification-id") {
              item {
                __typename
                ... on ViewingRoomPublishedNotificationItem {
                  partner {
                    internalID
                  }
                  viewingRoomIDs
                }
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        meNotificationLoader,
        meLoader,
        partnerLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        Object {
          "me": Object {
            "notification": Object {
              "item": Object {
                "__typename": "ViewingRoomPublishedNotificationItem",
                "partner": Object {
                  "internalID": "partner-id",
                },
                "viewingRoomIDs": Array [
                  "viewing-room-id",
                ],
              },
            },
          },
        }
      `)
    })
  })
})
