/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { toGlobalId } from "graphql-relay"

describe("filterArtworksConnection", () => {
  let context = null
  describe(`Provides filter results`, () => {
    beforeEach(() => {
      const gene = { id: "500-1000-ce" }

      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              gene_id: "500-1000-ce",
              aggregations: ["total"],
              for_sale: true,
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
                aggregations: {
                  total: {
                    value: 10,
                  },
                },
              })
            ),
        },
      }
    })

    it("returns a connection, and makes one gravity call when args passed inline", () => {
      const query = `
        {
          filterArtworksConnection(geneID: "500-1000-ce", first: 10, after: "", aggregations:[TOTAL], medium: "*", forSale: true) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({ filterArtworksConnection: { edges } }) => {
          expect(edges).toEqual([
            { node: { slug: "oseberg-norway-queens-ship" } },
          ])
        }
      )
    })

    it("returns a connection, and makes one gravity call when using variables", () => {
      const query = `
        query GeneFilter($count: Int, $cursor: String) {
          filterArtworksConnection(geneID: "500-1000-ce", first: $count, after: $cursor, aggregations:[TOTAL], medium: "*", forSale: true) {
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      const variableValues = {
        count: 10,
        cursor: "",
      }
      return runQuery(query, context, variableValues).then(
        ({ filterArtworksConnection: { edges } }) => {
          expect(edges).toEqual([
            { node: { slug: "oseberg-norway-queens-ship" } },
          ])
        }
      )
    })

    it("implements the NodeInterface", () => {
      const query = `
        {
          filterArtworksConnection(first: 10, geneID: "500-1000-ce", forSale: true, aggregations:[TOTAL], medium: "*"){
            id
          }
        }
      `
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
        page: 1,
        size: 10,
      }
      const expectedId = toGlobalId(
        "filterArtworksConnection",
        JSON.stringify(filterOptions)
      )
      return runQuery(query, context).then(
        ({ filterArtworksConnection: { id } }) => {
          expect(id).toEqual(expectedId)
        }
      )
    })

    it("fetches FilterArtworks using the node root field", () => {
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
        page: 1,
        size: 10,
      }
      const generatedId = toGlobalId(
        "filterArtworksConnection",
        JSON.stringify(filterOptions)
      )

      const query = `
        {
          node(id: "${generatedId}") {
            id
          }
        }
      `
      return runQuery(query, context).then(({ node: { id } }) => {
        expect(id).toEqual(generatedId)
      })
    })
  })

  describe(`Passes along an incoming page param over cursors`, () => {
    beforeEach(() => {
      const gene = { id: "500-1000-ce", browseable: true, family: "" }

      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks", {
              gene_id: "500-1000-ce",
              aggregations: ["total"],
              for_sale: true,
              page: 20,
              size: 30,
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
                aggregations: { total: { value: 1000 } },
              })
            ),
        },
      }
    })

    it("returns filtered artworks, and makes a gravity call", () => {
      const query = `
        {
          filterArtworksConnection(aggregations:[TOTAL], medium: "*", forSale: true, page: 20, first: 30, after: ""){
            pageInfo {
              endCursor
            }
            edges {
              node {
                slug 
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          filterArtworksConnection: {
            edges,
            pageInfo: { endCursor },
          },
        }) => {
          expect(edges).toEqual([
            { node: { slug: "oseberg-norway-queens-ship" } },
          ])
          // Check that the cursor points to the end of page 20, size 30.
          // Base64 encoded string: `arrayconnection:599`
          expect(endCursor).toEqual("YXJyYXljb25uZWN0aW9uOjU5OQ==")
        }
      )
    })
  })

  describe(`Pagination for the last page`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks")
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship-0",
                    cursor: Buffer.from("artwork:297").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-1",
                    cursor: Buffer.from("artwork:298").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-2",
                    cursor: Buffer.from("artwork:299").toString("base64"),
                  },
                  {
                    id: "oseberg-norway-queens-ship-3",
                    cursor: Buffer.from("artwork:300").toString("base64"),
                  },
                ],
                aggregations: {
                  total: {
                    value: 303,
                  },
                },
              })
            ),
        },
      }
    })

    it("caps pagination results to 100", () => {
      const query = `
        {
          filterArtworksConnection(first: 3, after: "${Buffer.from(
            "artwork:297"
          ).toString("base64")}", aggregations:[TOTAL]) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          filterArtworksConnection: {
            pageInfo: { hasNextPage },
          },
        }) => {
          expect(hasNextPage).toBeFalsy()
        }
      )
    })
  })

  describe(`Returns proper pagination information`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {},
        unauthenticatedLoaders: {
          filterArtworksLoader: sinon
            .stub()
            .withArgs("filter/artworks")
            .returns(
              Promise.resolve({
                hits: [
                  {
                    id: "oseberg-norway-queens-ship-0",
                  },
                  {
                    id: "oseberg-norway-queens-ship-1",
                  },
                  {
                    id: "oseberg-norway-queens-ship-2",
                  },
                  {
                    id: "oseberg-norway-queens-ship-3",
                  },
                ],
                aggregations: {
                  total: {
                    value: 5,
                  },
                },
              })
            ),
        },
      }
    })

    it("returns `true` for `hasNextPage` when there is more data", () => {
      const query = `
        {
          filterArtworksConnection(first: 4, after: "", aggregations:[TOTAL]) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          filterArtworksConnection: {
            pageInfo: { hasNextPage },
          },
        }) => {
          expect(hasNextPage).toBeTruthy()
        }
      )
    })
  })

  describe(`When requesting personalized arguments`, () => {
    beforeEach(() => {
      context = {
        authenticatedLoaders: {
          filterArtworksLoader: () =>
            Promise.resolve({
              hits: [
                {
                  id: "oseberg-norway-queens-ship-0",
                },
              ],
              aggregations: {
                total: {
                  value: 303,
                },
              },
            }),
        },
        unauthenticatedLoaders: {},
      }
    })

    it("returns results using the personalized loader", () => {
      const query = `
        {
          filterArtworksConnection(first: 1, after: "", aggregations:[TOTAL], includeArtworksByFollowedArtists: true){
            edges {
              node {
                slug
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({ filterArtworksConnection: { edges } }) => {
          expect(edges).toEqual([
            {
              node: { slug: "oseberg-norway-queens-ship-0" },
            },
          ])
        }
      )
    })
  })
})
