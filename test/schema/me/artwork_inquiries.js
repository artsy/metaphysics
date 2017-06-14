import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("ArtworkInquiries", () => {
    const gravity = sinon.stub()
    const Me = schema.__get__("Me")
    const ArtworkInquiries = Me.__get__("ArtworkInquiries")

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity)
      ArtworkInquiries.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      ArtworkInquiries.__ResetDependency__("gravity")
    })

    it("returns notification feed items w/ Relay pagination", () => {
      const query = `
        {
          me {
            artwork_inquiries_connection(first: 2) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  artwork {
                    title
                  }
                  impulse_conversation_id
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
              impulse_conversation_id: "420",
            },
          },
          {
            node: {
              artwork: { title: "Artwork 2" },
              impulse_conversation_id: null,
            },
          },
        ],
      }

      gravity.returns(
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
        })
      )

      return runAuthenticatedQuery(query).then(({ me: { artwork_inquiries_connection } }) => {
        expect(artwork_inquiries_connection).toEqual(expectedConnectionData)
      })
    })
  })
})
