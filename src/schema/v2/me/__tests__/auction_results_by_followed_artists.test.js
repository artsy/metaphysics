/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("ArtworkInquiries", () => {
    it("returns auction results by followed artists", async () => {
      const query = gql`
        {
          me {
            auctionResultsByFollowedArtists(first: 100) {
              totalCount
              edges {
                node {
                  title
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
            },
          },
          {
            node: {
              title: "Auction Result 2",
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
            },
            {
              title: "Auction Result 2",
            },
          ],
        },
      }))

      const followedArtistsLoader = jest.fn(async () => ({
        headers: { "x-total-count": 2 },
        body: [
          {
            id: "followartist-1",
            artist: {
              _id: "artist-1",
            },
          },
          {
            id: "followartist-2",
            artist: {
              _id: "artist-2",
            },
          },
        ],
      }))

      const context = {
        meLoader: () => Promise.resolve({}),
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
