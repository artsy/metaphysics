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
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      `

      const expectedConnectionData = {
        edges: [
          {
            node: {
              id: "auction-result-1",
              title: "Auction Result 1",
            },
          },
          {
            node: {
              id: "auction-result-2",
              title: "Auction Result 2",
            },
          },
        ],
      }

      const auctionLotsLoader = jest.fn(async () => ({
        total_count: 3,
        _embedded: {
          items: [
            {
              id: "auction-result-1",
              title: "Auction Result 1",
            },
            {
              id: "auction-result-2",
              title: "Auction Result 2",
            },
          ],
        },
      }))

      const followedArtistsLoader = jest.fn(async () => ({
        headers: { "x-total-count": 3 },
        body: [
          {
            id: "artist-1",
          },
          {
            id: "artist-2",
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
      expect(auctionLotsLoader).toHaveBeenCalledWith({
        allow_empty_created_dates: undefined,
        artist_id: "4dd1584de0091e000100207c",
        categories: undefined,
        earliest_created_year: undefined,
        latest_created_year: undefined,
        organizations: undefined,
        page: 1,
        size: 100,
        sizes: undefined,
        sort: undefined,
      })
    })
  })
})
