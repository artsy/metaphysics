import { resolve } from "path"
import { readFileSync } from "fs"
import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("me { saved_artwork", () => {
  describe("Handles getting collection metadata", () => {
    const Collection = schema.__get__("Collection")
    let gravity = null
    beforeEach(() => {
      gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)

      Collection.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      Collection.__ResetDependency__("gravity")
    })

    it("returns artworks for a collection", () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "artworks_array.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))
      gravity
        .withArgs("collection/saved-artwork/artworks", { size: 10, offset: 0, total_count: true, user_id: "user-42" })
        .returns(Promise.resolve({ body: artworks, headers: { "x-total-count": 10 } }))

      const query = `
        {
          me {
            saved_artworks {
              artworks_connection(first:10) {
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
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
