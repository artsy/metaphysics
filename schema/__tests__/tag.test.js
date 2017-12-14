import schema from "schema"
import { runQuery } from "test/utils"

describe("Tag", () => {
  describe("For just querying the tag artworks", () => {
    const Tag = schema.__get__("Tag")
    const filterArtworks = Tag.__get__("filterArtworks")

    // If this test fails because it's making a gravity request to /tag/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    beforeEach(() => {
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      gravity
        .withArgs("filter/artworks", {
          tag_id: "butt",
          aggregations: ["total"],
        })
        .returns(
          Promise.resolve({
            hits: [
              {
                id: "oseberg-norway-queens-ship",
                title: "Queen's Ship",
                artists: [],
              },
            ],
            aggregations: [],
          })
        )
      filterArtworks.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      filterArtworks.__ResetDependency__("gravity")
    })

    it("returns filtered artworks", () => {
      const query = `
        {
          tag(id: "butt") {
            filtered_artworks(aggregations:[TOTAL]){
              hits {
                id
              }
            }
          }
        }
      `

      return runQuery(query).then(({ tag: { filtered_artworks: { hits } } }) => {
        expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
      })
    })
  })
})
