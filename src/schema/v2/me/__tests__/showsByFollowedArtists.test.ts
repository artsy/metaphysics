/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("ShowsByFollowedArtists", () => {
    it("returns shows by followed artists", async () => {
      const query = gql`
        {
          me {
            showsByFollowedArtists(
              first: 100
              sort: NAME_ASC
              status: UPCOMING
            ) {
              totalCount
              edges {
                node {
                  name
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
              name: "Show 1",
            },
          },
          {
            node: {
              name: "Show 2",
            },
          },
        ],
      }

      const followedArtistsShowsLoader = jest.fn(async () => ({
        headers: { "x-total-count": 2 },
        body: [
          {
            name: "Show 1",
          },
          {
            name: "Show 2",
          },
        ],
      }))

      const context = {
        meLoader: () => Promise.resolve({}),
        followedArtistsShowsLoader,
      }

      const {
        me: { showsByFollowedArtists },
      } = await runAuthenticatedQuery(query, context)

      expect(showsByFollowedArtists).toEqual(expectedConnectionData)

      expect(followedArtistsShowsLoader).toHaveBeenCalledWith({
        offset: 0,
        size: 100,
        sort: "name",
        status: "upcoming",
        total_count: true,
      })
    })
  })
})
