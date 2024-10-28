/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("myCollectionAuctionResults", () => {
    it("returns auction results My Collection artists", async () => {
      const query = gql`
        {
          me {
            myCollectionAuctionResults(first: 100) {
              totalCount
              edges {
                node {
                  title
                  artist {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const expectedConnectionData = {
        totalCount: 2,
        edges: [
          {
            node: {
              title: "Auction Result 1",
              artist: {
                name: "Artist 1",
              },
            },
          },
          {
            node: {
              title: "Auction Result 2",
              artist: {
                name: "Artist 2",
              },
            },
          },
        ],
      }

      const collectionArtistsLoader = jest.fn().mockResolvedValue({
        headers: { "x-total-count": 2 },
        body: [
          {
            id: "an-artist-1",
            _id: "artist-1",
            name: "Artist 1",
          },
          {
            id: "an-artist-2",
            _id: "artist-2",
            name: "Artist 2",
          },
        ],
      })

      const auctionLotsLoader = jest.fn(async () => ({
        total_count: 2,
        _embedded: {
          items: [
            {
              title: "Auction Result 1",
              artist_id: "artist-1",
            },
            {
              title: "Auction Result 2",
              artist_id: "artist-2",
            },
            {
              title: "Auction Result Without Artist ID",
            },
          ],
        },
      }))

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        collectionArtistsLoader,
        auctionLotsLoader,
      }

      const {
        me: { myCollectionAuctionResults },
      } = await runAuthenticatedQuery(query, context)

      expect(myCollectionAuctionResults).toEqual(expectedConnectionData)

      expect(collectionArtistsLoader).toHaveBeenCalled()
      expect(auctionLotsLoader).toHaveBeenCalled()
    })
  })
})
