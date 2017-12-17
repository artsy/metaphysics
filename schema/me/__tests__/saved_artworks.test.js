import gql from "test/gql"
import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"

describe("me { saved_artwork", () => {
  describe("Handles getting collection metadata", () => {
    it("returns artworks for a collection", async () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "artworks_array.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))

      const query = gql`
        {
          me {
            saved_artworks {
              description
              artworks_connection(first: 10) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      `
      const rootValue = {
        collectionLoader: id => id === "saved-artwork" && Promise.resolve({ description: "My beautiful collection" }),
        collectionArtworksLoader: params => {
          if (params === { size: 10, offset: 0, total_count: true }) {
            return Promise.resolve({ body: artworks, headers: { "x-total-count": 10 } })
          }
        },
      }
      const data = await runAuthenticatedQuery(query, rootValue)
      expect(data).toMatchSnapshot()
    })
  })
})
