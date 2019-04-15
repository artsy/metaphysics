import { runQuery } from "test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
require("../link").mockFetch as jest.Mock<any>

describe("TopArtworks type", () => {
  const artwork = {
    id: "lona-misa",
    artist: {
      id: "artist-slug",
      _id: "artist-id",
    },
    category: "Painting",
    title: "Lona Misa",
  }
  const artworkLoader = jest.fn(() => Promise.resolve(artwork))
  const artistLoader = jest.fn(() =>
    Promise.resolve({
      _id: "artist-id",
    })
  )
  const context: Partial<ResolverContext> = {
    artworkLoader,
    artistLoader,
  }
  const query = gql`
    query {
      analyticsPartnerStats(partnerId: "lol") {
        topArtworks(period: FOUR_WEEKS) {
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
  `

  it("is accessible through the artwork type", async () => {
    const result = await runQuery(query, context)
    expect(result).toMatchInlineSnapshot(`
Object {
  "analyticsPartnerStats": Object {
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
}
`)
  })
})
