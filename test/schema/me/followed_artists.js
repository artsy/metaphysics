import { resolve } from "path"
import { readFileSync } from "fs"
import { runAuthenticatedQuery } from "test/utils"

describe("Collections", () => {
  describe("Handles getting collection metadata", () => {
    it("returns artworks for a collection", () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "follow_artists.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))

      const myFollowedGenesLoader = sinon
        .stub()
        .withArgs("me/follow/artists", { size: 10, offset: 0, total_count: true })
        .returns(Promise.resolve({ body: artworks, headers: { "x-total-count": 10 } }))

      const query = `
        {
          me {
            followed_artists_connection(first: 10) {
              edges {
                node {
                  artist {
                    name,
                    id
                  }
                }
              }
            }
          }
        }
      `
      return runAuthenticatedQuery(query, { myFollowedGenesLoader }).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
