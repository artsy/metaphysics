/* eslint-disable promise/always-return */
import { assign } from "lodash"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Notifications", () => {
    it("returns notification feed items w/ Relay pagination", () => {
      const query = `
        {
          me {
            notifications_connection(first: 1) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  __id
                  status
                  date(format: "YYYY")
                  artworks {
                    title
                  }
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      `

      const artworkStub = { artists: [] }

      const artwork1 = assign({}, artworkStub, { title: "Artwork1" })
      const artwork2 = assign({}, artworkStub, { title: "Artwork2" })

      const expectedConnectionData = {
        pageInfo: {
          hasNextPage: true,
        },
        edges: [
          {
            node: {
              __id: "Tm90aWZpY2F0aW9uc0ZlZWRJdGVtOnVuaXF1ZS1pZC15bw==",
              status: "READ",
              image: {
                url: "cloudfront.url",
              },
              date: "2017",
              artworks: [{ title: "Artwork1" }, { title: "Artwork2" }],
            },
          },
        ],
      }

      const rootValue = {
        notificationsFeedLoader: sinon.stub().returns(
          Promise.resolve({
            total: 2,
            feed: [
              {
                status: "read",
                object: { artists: [{ image_url: "cloudfront.url" }] },
                object_ids: ["artwork1", "artwork2"],
                date: "2017-02-17T17:19:44.000Z",
                actors: "Cats are the best actors.",
                id: "unique-id-yo",
              },
            ],
          })
        ),
        artworksLoader: sinon
          .stub()
          .returns(Promise.resolve([artwork1, artwork2])),
      }

      return runAuthenticatedQuery(query, rootValue).then(
        ({ me: { notifications_connection } }) => {
          expect(notifications_connection).toEqual(expectedConnectionData)
        }
      )
    })
  })
})
