// TODO: Switch to v2
import { runQuery } from "schema/v1/test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
require("../link").mockFetch as jest.Mock<any>

describe("AnalyticsRankedStats type", () => {
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
  // TODO: after fixing parseFieldASTsIntoArray partnerLoader is not required
  // unless the query is run with slug, or other partner fields TODO: add tests for both cases
  const partnerLoader = jest.fn(() => Promise.resolve({ _id: "lol" }))
  const context: Partial<ResolverContext> = {
    artworkLoader,
    artistLoader,
    partnerLoader,
  }
  const query = gql`
    query {
      partner(id: "lol") {
        analytics {
          topArtworks: rankedStats(
            first: 1
            objectType: ARTWORK
            period: ONE_YEAR
          ) {
            edges {
              node {
                entity {
                  ... on Artwork {
                    title
                  }
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
                    "entity": Object {
                      "title": "Lona Misa",
                    },
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
