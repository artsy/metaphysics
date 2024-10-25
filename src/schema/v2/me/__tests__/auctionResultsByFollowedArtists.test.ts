/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("AuctionResultsByFollowedArtists", () => {
    it("returns auction results by followed artists", async () => {
      const query = gql`
        {
          me {
            auctionResultsByFollowedArtists(first: 100) {
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

      const followedArtistsLoader = jest.fn().mockResolvedValue({
        headers: { "x-total-count": 2 },
        body: [
          {
            id: "followartist-1",
            artist: {
              _id: "artist-1",
              name: "Artist 1",
            },
          },
          {
            id: "followartist-2",
            artist: {
              _id: "artist-2",
              name: "Artist 2",
            },
          },
        ],
      })

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        followedArtistsLoader,
        auctionLotsLoader,
      }

      const {
        me: { auctionResultsByFollowedArtists },
      } = await runAuthenticatedQuery(query, context)

      expect(auctionResultsByFollowedArtists).toEqual(expectedConnectionData)

      expect(followedArtistsLoader).toHaveBeenCalled()
      expect(auctionLotsLoader).toHaveBeenCalled()
    })
  })
})
