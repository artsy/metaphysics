/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Me", () => {
  describe("ArtworkInquiries", () => {
    it("returns notification feed items w/ Relay pagination", () => {
      const query = gql`
        {
          me {
            artworkInquiriesConnection(first: 2) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  artwork {
                    title
                  }
                  impulseConversationID
                }
              }
            }
          }
        }
      `

      const artwork1 = { id: "artwork1", title: "Artwork 1", artists: [] }
      const artwork2 = { id: "artwork2", title: "Artwork 2", artists: [] }

      const expectedConnectionData = {
        pageInfo: {
          hasNextPage: true,
        },
        edges: [
          {
            node: {
              artwork: { title: "Artwork 1" },
              impulseConversationID: "420",
            },
          },
          {
            node: {
              artwork: { title: "Artwork 2" },
              impulseConversationID: null,
            },
          },
        ],
      }

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        inquiryRequestsLoader: () =>
          Promise.resolve({
            headers: { "x-total-count": 3 },
            body: [
              {
                inquireable: artwork1,
                impulse_conversation_id: "420",
              },
              {
                inquireable: artwork2,
              },
            ],
          }),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { artworkInquiriesConnection } }) => {
          expect(artworkInquiriesConnection).toEqual(expectedConnectionData)
        }
      )
    })
  })
})
