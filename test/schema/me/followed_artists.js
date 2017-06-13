import { resolve } from "path"
import { readFileSync } from "fs"
import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Collections", () => {
  describe("Handles getting collection metadata", () => {
    const Me = schema.__get__("Me")
    const FollowedArtists = Me.__get__("FollowedArtists")

    let gravity = null
    beforeEach(() => {
      gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)

      FollowedArtists.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      FollowedArtists.__ResetDependency__("gravity")
    })

    it("returns artworks for a collection", () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "follow_artists.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))

      gravity
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
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
