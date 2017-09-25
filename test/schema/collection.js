import { resolve } from "path"
import { readFileSync } from "fs"
import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

const gravityData = {
  id: "saved-artwork",
  name: "Saved Artwork",
  default: true,
  description: "",
  image_url: null,
  image_versions: null,
  private: false,
}

describe("Collections", () => {
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

    it("returns collection metadata", () => {
      gravity.withArgs("collection/saved-artwork", { user_id: "user-42" }).returns(Promise.resolve(gravityData))

      const query = `
        {
          collection(id: "saved-artwork") {
            name
            private
            default
          }
        }
      `
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })

    it("returns artworks for a collection", () => {
      const artworksPath = resolve("test", "fixtures", "gravity", "artworks_array.json")
      const artworks = JSON.parse(readFileSync(artworksPath, "utf8"))
      gravity
        .withArgs("collection/saved-artwork/artworks", {
          size: 10,
          offset: 0,
          private: false,
          total_count: true,
          user_id: "user-42",
          sort: "-position",
        })
        .returns(Promise.resolve({ body: artworks, headers: { "x-total-count": 10 } }))

      const query = `
        {
          collection(id: "saved-artwork") {
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
      `
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })

    it("ignores errors from gravity.", () => {
      gravity
        .withArgs("collection/saved-artwork/artworks", {
          size: 10,
          offset: 0,
          private: false,
          total_count: true,
          user_id: "user-42",
          sort: "-position",
        })
        .returns(Promise.reject(new Error("Collection Not Found")))

      const query = `
                {
                  collection(id: "saved-artwork") {
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
              `
      return runAuthenticatedQuery(query).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })
})
