import { runQuery } from "test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
require("../link").mockFetch as jest.Mock<any>

describe("RankedStats type", () => {
  const artwork = {
    id: "lona-misa",
    artist: {
      id: "artist-slug",
      _id: "artist-id",
    },
    category: "Painting",
    title: "Lona Misa",
  }
  const show = {
    id: "show-id",
  }
  const artworkLoader = jest.fn(() => Promise.resolve(artwork))
  const showLoader = jest.fn(() => Promise.resolve(show))
  const artistLoader = jest.fn(() =>
    Promise.resolve({
      _id: "artist-id",
    })
  )
  // TODO: after fixing parseFieldASTsIntoArray partnerLoader is not required
  // unless the query is run with slug, or other partner fields TODO: add tests for both cases
  const partnerLoader = jest.fn(() => Promise.resolve({ _id: "lol" }))
  const context: Partial<ResolverContext> = {
    artworkLoader,
    artistLoader,
    partnerLoader,
    showLoader,
  }
  const query = gql`
    query {
      partner(id: "lol") {
        analytics {
          rankedStats(objectType: ARTWORK, period: FOUR_WEEKS) {
            edges {
              node {
                value
                period
                artwork {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  `

  it("is accessible through the partner type", async () => {
    const result = await runQuery(query, context)
    expect(result).toMatchInlineSnapshot(`
Object {
  "partner": Object {
    "analytics": Object {
      "topArtworks": Object {
        "edges": Array [
          Object {
            "node": Object {
              "artwork": Object {
                "id": "lona-misa",
                "title": "Lona Misa",
              },
              "period": "FOUR_WEEKS",
              "value": 76,
            },
          },
          Object {
            "node": Object {
              "artwork": Object {
                "id": "lona-misa",
                "title": "Lona Misa",
              },
              "period": "FOUR_WEEKS",
              "value": 51,
            },
          },
        ],
      },
    },
  },
}
`)
  })
})
