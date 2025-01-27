import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("discoverArtworks", () => {
  describe("with no arguments", () => {
    it("should call the artworksDiscoveryLoader with default arguments and return a connection", async () => {
      const artworksDiscoveryLoader = jest
        .fn()
        .mockResolvedValue([{ id: "artwork-1" }, { id: "artwork-2" }])

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

  describe("with arguments", () => {
    it("should call the artworksDiscoveryLoader with the provided arguments", async () => {
      const artworksDiscoveryLoader = jest
        .fn()
        .mockResolvedValue([{ id: "artwork-1" }, { id: "artwork-2" }])

      const context = { artworksDiscoveryLoader }

      const query = gql`
        {
          discoverArtworks(
            limit: 10
            excludeArtworkIds: ["artwork-1"]
            likedArtworkIds: ["artwork-2"]
            mltFields: ["materials", "tags", "medium"]
            osWeights: [0.5, 0.5]
            curatedPicksSize: 3
          ) {
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
        limit: 10,
        exclude_artwork_ids: ["artwork-1"],
        liked_artwork_ids: ["artwork-2"],
        mlt_fields: ["materials", "tags", "medium"],
        os_weights: [0.5, 0.5],
        curated_picks_size: 3,
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
