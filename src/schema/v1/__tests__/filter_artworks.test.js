/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { toGlobalId } from "graphql-relay"

describe("Filter Artworks", () => {
  let context = null
  describe(`Does not pass along the medium param if it is "*"`, () => {
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
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
      }
    })

    it("returns filtered artworks, and makes a gravity call", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
            filtered_artworks(aggregations:[TOTAL], medium: "*", for_sale: true){
              hits {
                id
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          gene: {
            filtered_artworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
        }
      )
    })

    it("returns a connection, and makes one gravity call", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
            filtered_artworks(aggregations:[TOTAL], medium: "*", for_sale: true){
              hits {
                id
              }
              artworks_connection(first: 10, after: "") { 
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          gene: {
            filtered_artworks: {
              hits,
              artworks_connection: { edges },
            },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
          expect(edges).toEqual([
            { node: { id: "oseberg-norway-queens-ship" } },
          ])
        }
      )
    })

    it("implements the NodeInterface", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
            filtered_artworks(for_sale: true, aggregations:[TOTAL], medium: "*"){
              __id
            }
          }
        }
      `
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
      }
      const expectedId = toGlobalId(
        "FilterArtworks",
        JSON.stringify(filterOptions)
      )
      return runQuery(query, context).then(
        ({
          gene: {
            filtered_artworks: { __id },
          },
        }) => {
          expect(__id).toEqual(expectedId)
        }
      )
    })

    it("fetches FilterArtworks using the node root field", () => {
      const filterOptions = {
        aggregations: ["total"],
        for_sale: true,
        gene_id: "500-1000-ce",
      }
      const generatedId = toGlobalId(
        "FilterArtworks",
        JSON.stringify(filterOptions)
      )

      const query = `
        {
          node(__id: "${generatedId}") {
            __id
          }
        }
      `
      return runQuery(query, context).then(({ node: { __id } }) => {
        expect(__id).toEqual(generatedId)
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
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
      }
    })

    it("returns filtered artworks, and makes a gravity call", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
            filtered_artworks(aggregations:[TOTAL], medium: "*", for_sale: true, page: 20){
              artworks_connection(first: 30, after: "") {
                pageInfo {
                  endCursor
                }
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          gene: {
            filtered_artworks: {
              artworks_connection: {
                edges,
                pageInfo: { endCursor },
              },
            },
          },
        }) => {
          expect(edges).toEqual([
            { node: { id: "oseberg-norway-queens-ship" } },
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
          filter_artworks(aggregations:[TOTAL]){
            artworks_connection(first: 3, after: "${Buffer.from(
              "artwork:297"
            ).toString("base64")}"){
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      return runQuery(query, context).then(({ filter_artworks }) => {
        expect(filter_artworks.artworks_connection.pageInfo).toEqual({
          hasNextPage: false,
        })
      })
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
          filter_artworks(aggregations:[TOTAL], include_artworks_by_followed_artists: true){
            artworks_connection(first: 1){
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then(({ filter_artworks }) => {
        expect(filter_artworks.artworks_connection.edges).toEqual([
          {
            node: { id: "oseberg-norway-queens-ship-0" },
          },
        ])
      })
    })
  })
})
