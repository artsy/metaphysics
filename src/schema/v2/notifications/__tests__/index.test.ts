import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import moment from "moment-timezone"

describe("notificationsConnection", () => {
  const notificationsFeedLoader = jest.fn(() =>
    Promise.resolve({
      feed: [notificationFeedItem],
      total: 100,
      total_unread: 10,
    })
  )

  afterEach(() => {
    notificationsFeedLoader.mockClear()
  })

  it("returns data", async () => {
    const query = gql`
      {
        notificationsConnection(first: 10) {
          totalCount
          counts {
            total
            unread
          }
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
    `

    const data = await runAuthenticatedQuery(query, {
      notificationsFeedLoader,
    })

    expect(notificationsFeedLoader).toHaveBeenCalledWith({
      size: 10,
      page: 1,
    })

    expect(data).toEqual(expectedData)
  })

  describe("with activity types filter", () => {
    it("returns data and filters by activity types", async () => {
      const query = gql`
        {
          notificationsConnection(
            first: 10
            notificationTypes: [ARTWORK_ALERT, ARTWORK_PUBLISHED]
          ) {
            totalCount
            counts {
              total
              unread
            }
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
      `

      const data = await runAuthenticatedQuery(query, {
        notificationsFeedLoader,
      })

      expect(notificationsFeedLoader).toHaveBeenCalledWith({
        activity_types: ["SavedSearchHitActivity", "ArtworkPublishedActivity"],
        size: 10,
        page: 1,
      })

      expect(data).toEqual(expectedData)
    })
  })

  describe("with publication date", () => {
    describe("the human-friendly date", () => {
      const query = gql`
        {
          notificationsConnection(first: 1) {
            edges {
              node {
                publishedAt(format: "RELATIVE")
              }
            }
          }
        }
      `

      it("should return `Today` label", async () => {
        const loader = () => {
          return Promise.resolve({
            feed: [{ ...notificationFeedItem, date: moment() }],
            total: 1,
            total_unread: 1,
          })
        }
        const data = await runAuthenticatedQuery(query, {
          notificationsFeedLoader: loader,
        })
        const edges = data.notificationsConnection.edges
        const item = edges[0].node

        expect(item.publishedAt).toEqual("Today")
      })

      it("should return `Yesterday` label", async () => {
        const loader = () => {
          return Promise.resolve({
            feed: [
              {
                ...notificationFeedItem,
                // 23:59:59 yesterday
                date: moment().endOf("day").subtract(1, "days"),
              },
            ],
            total: 1,
            total_unread: 1,
          })
        }
        const data = await runAuthenticatedQuery(query, {
          notificationsFeedLoader: loader,
        })
        const edges = data.notificationsConnection.edges
        const item = edges[0].node

        expect(item.publishedAt).toEqual("Yesterday")
      })

      it("should return `x days ago` label", async () => {
        const loader = () => {
          return Promise.resolve({
            feed: [
              {
                ...notificationFeedItem,
                date: moment().subtract(5, "days"),
              },
            ],
            total: 1,
            total_unread: 1,
          })
        }
        const data = await runAuthenticatedQuery(query, {
          notificationsFeedLoader: loader,
        })
        const edges = data.notificationsConnection.edges
        const item = edges[0].node

        expect(item.publishedAt).toEqual("5 days ago")
      })
    })

    it("should return raw date", async () => {
      const query = gql`
        {
          notificationsConnection(first: 1) {
            edges {
              node {
                publishedAt
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        notificationsFeedLoader,
      })
      const edges = data.notificationsConnection.edges
      const item = edges[0].node

      expect(item.publishedAt).toEqual("2022-08-22T21:15:49Z")
    })

    it("should return date in the specified format", async () => {
      const query = gql`
        {
          notificationsConnection(first: 1) {
            edges {
              node {
                publishedAt(format: "YYYY-MM-DD")
              }
            }
          }
        }
      `

      const data = await runAuthenticatedQuery(query, {
        notificationsFeedLoader,
      })
      const edges = data.notificationsConnection.edges
      const item = edges[0].node

      expect(item.publishedAt).toEqual("2022-08-22")
    })
  })
})

const notificationFeedItem = {
  id: "6303f205b54941000843419a",
  actors: "Works by Damien Hirst",
  message: "8 Works Added",
  status: "unread",
  date: "2022-08-22T21:15:49.000Z",
  object_ids: ["63036fafbe5cfc000cf358e3", "630392514f13a5000b55ecec"],
  objects_count: 2,
  object: {
    artist: { id: "damien-hirst", _id: "4d8b926a4eb68a1b2c0000ae" },
  },
  activity_type: "ArtworkPublishedActivity",
  target_href: "/artist/damien-hirst/works-for-sale",
}

const expectedData = {
  notificationsConnection: {
    totalCount: 100,
    counts: {
      total: 100,
      unread: 10,
    },
    edges: [
      {
        node: {
          internalID: "6303f205b54941000843419a",
          isUnread: true,
          createdAt: "2022",
          notificationType: "ARTWORK_PUBLISHED",
          title: "Works by Damien Hirst",
          message: "8 works added",
          targetHref: "/artist/damien-hirst/works-for-sale",
          objectsCount: 2,
        },
      },
    ],
  },
}
