/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Tag", () => {
  describe("For just querying the tag artworks", () => {
    // If this test fails because it's making a gravity request to /tag/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    it("returns filtered artworks", () => {
      const rootValue = {
        filterArtworksLoader: sinon
          .stub()
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
          ),
      }
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

      return runQuery(query, rootValue).then(
        ({
          tag: {
            filtered_artworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
        }
      )
    })
  })
})
