import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("watchedLotConnection", () => {
  it("returns data", async () => {
    const query = gql`
      {
        me {
          watchedLotConnection {
            edges {
              node {
                saleArtwork {
                  internalID
                }
              }
            }
          }
        }
      }
    `

    const context = {
      meLoader: jest.fn().mockResolvedValue({ internalID: "Baz" }),
      saleArtworksAllLoader: jest.fn().mockResolvedValue({
        headers: {
          "x-total-count": 1,
        },
        body: [
          {
            _id: "foo",
          },
        ],
      }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      me: {
        watchedLotConnection: {
          edges: [
            {
              node: {
                saleArtwork: { internalID: "foo" },
              },
            },
          ],
        },
      },
    })
  })
})
