import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollectionInfo", () => {
  it("includes info about my collection", async () => {
    const query = gql`
      {
        me {
          myCollectionInfo {
            name
            includesPurchasedArtworks
            artworksCount
            artistsCount
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: async () => ({
        id: "some-user-id",
      }),
      collectionLoader: async () => ({
        name: "My Collection",
        includes_purchased_artworks: true,
        artworks_count: 20,
        artists_count: 2,
      }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionInfo).toMatchInlineSnapshot(`
      Object {
        "artistsCount": 2,
        "artworksCount": 20,
        "includesPurchasedArtworks": true,
        "name": "My Collection",
      }
    `)
  })

  describe("collectedArtistsConnection", () => {
    it("returns a connection for the artists in the users' collection", async () => {
      const query = gql`
        {
          me {
            myCollectionInfo {
              collectedArtistsConnection(first: 5) {
                totalCount
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        collectionLoader: async () => ({}),
        meLoader: async () => ({
          id: "some-user-id",
        }),
        collectionArtistsLoader: async () => ({
          headers: { "x-total-count": "3" },
          body: [
            {
              name: "Artist 1",
            },
            {
              name: "Artist 2",
            },
            {
              name: "Artist 3",
            },
          ],
        }),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toEqual(collectedArtistsConnectionData)

      expect(data.me.myCollectionInfo.collectedArtistsConnection)
        .toMatchInlineSnapshot(`
        Object {
          "edges": Array [
            Object {
              "node": Object {
                "name": "Artist 1",
              },
            },
            Object {
              "node": Object {
                "name": "Artist 2",
              },
            },
            Object {
              "node": Object {
                "name": "Artist 3",
              },
            },
          ],
          "totalCount": 3,
        }
      `)
    })
  })
})

const collectedArtistsConnectionData = {
  me: {
    myCollectionInfo: {
      collectedArtistsConnection: {
        totalCount: 3,
        edges: [
          {
            node: {
              name: "Artist 1",
            },
          },
          {
            node: {
              name: "Artist 2",
            },
          },
          {
            node: {
              name: "Artist 3",
            },
          },
        ],
      },
    },
  },
}
