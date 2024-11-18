import { runQuery } from "schema/v2/test/utils"
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
  const partnerLoader = jest.fn(() =>
    Promise.resolve({ _id: "5a323ece7b13bfbb07a0caf7" })
  )
  const context: Partial<ResolverContext> = {
    artworkLoader,
    artistLoader,
    partnerLoader,
  }
  const query = gql`
    query($id: String!) {
      partner(id: $id) {
        analytics {
          rankedStats(first: 1, objectType: ARTWORK, period: ONE_YEAR) {
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

  describe("when partner queries with partner id", () => {
    let result
    beforeAll(async () => {
      result = await runQuery(query, context, {
        id: "5a323ece7b13bfbb07a0caf7",
      })
    })
    it("won't query gravity loader", () => {
      expect(partnerLoader).not.toHaveBeenCalled()
    })
    it("is accessible through the partner type", () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "partner": {
            "analytics": {
              "rankedStats": {
                "edges": [
                  {
                    "node": {
                      "entity": {
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

  describe("when partner queries with partner slug", () => {
    let result
    beforeAll(async () => {
      result = await runQuery(query, context, {
        id: "partner-slug",
      })
    })
    it("will query gravity loader to get partner id", () => {
      expect(partnerLoader).toHaveBeenCalledWith("partner-slug")
    })
    it("is accessible through the partner type", () => {
      expect(result).toMatchInlineSnapshot(`
        {
          "partner": {
            "analytics": {
              "rankedStats": {
                "edges": [
                  {
                    "node": {
                      "entity": {
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
})
