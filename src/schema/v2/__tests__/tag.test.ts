/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Tag", () => {
  describe("For just querying the tag artworks", () => {
    // If this test fails because it's making a gravity request to /tag/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    it("returns filtered artworks", async () => {
      const context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                {
                  id: "oseberg-norway-queens-ship",
                  title: "Queen's Ship",
                  artists: [],
                },
              ],
              aggregations: {
                total: {
                  value: 1,
                },
              },
            }),
        },
      }
      const query = `
        {
          tag(id: "butt") {
            filterArtworksConnection(first: 1) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const { tag } = await runQuery(query, context)
      expect(
        tag.filterArtworksConnection.edges.map(({ node }) => node.slug)
      ).toEqual(["oseberg-norway-queens-ship"])
    })
  })
})
