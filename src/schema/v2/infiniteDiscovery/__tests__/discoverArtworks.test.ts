import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("discoverArtworks", () => {
  describe("with no arguments", () => {
    it("should call the artworksDiscoveryLoader with default arguments and return a connection", async () => {
      const artworksDiscoveryLoader = jest.fn().mockResolvedValue({
        artworks: [{ id: "artwork-1" }, { id: "artwork-2" }],
      })

      const context = { artworksDiscoveryLoader }

      const query = gql`
        {
          discoverArtworks {
            edges {
              node {
                id
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)

      expect(artworksDiscoveryLoader).toHaveBeenCalledWith({
        limit: 5,
        exclude_artwork_ids: undefined,
        mlt_fields: ["genes", "materials", "tags", "medium"],
        liked_artwork_ids: undefined,
        os_weights: [0.6, 0.4],
        curated_picks_size: 2,
      })

      expect(result).toMatchInlineSnapshot(`
        {
          "discoverArtworks": {
            "edges": [
              {
                "node": {
                  "id": "QXJ0d29yazphcnR3b3JrLTE=",
                },
              },
              {
                "node": {
                  "id": "QXJ0d29yazphcnR3b3JrLTI=",
                },
              },
            ],
          },
        }
      `)
    })
  })
})
