import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("NotificationItem", () => {
  const notificationPayload = {
    id: "user-notification-id",
    actor_ids: ["actor-id"],
    object_ids: ["object-id1"],
  }
  let meNotificationLoader
  let mePartnerOfferLoader = jest.fn()

  const meLoader = jest.fn(() => Promise.resolve({ id: "user-id" }))

  afterEach(() => {
    meLoader.mockClear()
    meNotificationLoader.mockClear()
    mePartnerOfferLoader.mockClear()
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
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "ArtworkPublishedNotificationItem",
                "artists": [
                  {
                    "name": "Catty Artist",
                  },
                ],
                "artworksConnection": {
                  "edges": [
                    {
                      "node": {
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
        attribution_class: ["open edition", "unique"],
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
                    attributionClass
                    labels {
                      displayValue
                    }
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
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "AlertNotificationItem",
                "alert": {
                  "attributionClass": [
                    "open edition",
                    "unique",
                  ],
                  "internalID": "search-criteria-id",
                  "labels": [
                    {
                      "displayValue": "Open edition",
                    },
                    {
                      "displayValue": "Unique",
                    },
                  ],
                },
                "artworksConnection": {
                  "edges": [
                    {
                      "node": {
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
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "ArticleFeaturedArtistNotificationItem",
                "article": {
                  "internalID": "article-id",
                },
                "artistsConnection": {
                  "edges": [
                    {
                      "node": {
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
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "ShowOpenedNotificationItem",
                "partner": {
                  "internalID": "partner-id",
                },
                "showsConnection": {
                  "edges": [
                    {
                      "node": {
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
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "ViewingRoomPublishedNotificationItem",
                "partner": {
                  "internalID": "partner-id",
                },
                "viewingRoomIDs": [
                  "viewing-room-id",
                ],
              },
            },
          },
        }
      `)
    })
  })

  describe('for "PartnerOfferCreatedNotificationItem"', () => {
    const artworksLoader = jest.fn(() =>
      Promise.resolve([
        {
          id: "artwork-id",
          title: "Catty Artwork",
        },
      ])
    )

    beforeEach(() => {
      mePartnerOfferLoader = jest.fn(() =>
        Promise.resolve({
          id: "partner-offer-id",
          available: true,
          end_at: "2024-01-08T10:10:10+10:00",
          price_currency: "EUR",
          price_listed: 100.0,
          price_with_discount: 90.0,
        })
      )

      meNotificationLoader = jest.fn(() =>
        Promise.resolve({
          ...notificationPayload,
          activity_type: "PartnerOfferCreatedActivity",
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
                ... on PartnerOfferCreatedNotificationItem {
                  available
                  expiresAt

                  partnerOffer {
                    isAvailable
                    endAt
                    priceListedMessage
                    priceWithDiscountMessage
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
        mePartnerOfferLoader,
        artworksLoader,
      })

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "notification": {
              "item": {
                "__typename": "PartnerOfferCreatedNotificationItem",
                "artworksConnection": {
                  "edges": [
                    {
                      "node": {
                        "title": "Catty Artwork",
                      },
                    },
                  ],
                },
                "available": true,
                "expiresAt": "2024-01-08T10:10:10+10:00",
                "partnerOffer": {
                  "endAt": "2024-01-08T10:10:10+10:00",
                  "isAvailable": true,
                  "priceListedMessage": "€100",
                  "priceWithDiscountMessage": "€90",
                },
              },
            },
          },
        }
      `)
    })
  })
})
