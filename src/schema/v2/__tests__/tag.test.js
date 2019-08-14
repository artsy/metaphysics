/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Tag", () => {
  // FIXME: Tag no longer has a direct connection to filtered artworks
  describe.skip("For just querying the tag artworks", () => {
    // If this test fails because it's making a gravity request to /tag/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    it("returns filtered artworks", () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
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
        },
      }
      const query = `
        {
          tag(id: "butt") {
            filteredArtworksConnection(aggregations:[TOTAL]){
              hits {
                slug
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          tag: {
            filteredArtworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ slug: "oseberg-norway-queens-ship" }])
        }
      )
    })
  })
})
