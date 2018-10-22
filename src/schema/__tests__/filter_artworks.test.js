/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { toGlobalId } from "graphql-relay"

describe("Filter Artworks", () => {
  let rootValue = null
  describe(`Does not pass along the medium param if it is "*"`, () => {
    beforeEach(() => {
      const gene = { id: "500-1000-ce", browseable: true, family: "" }

      rootValue = {
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
              aggregations: [],
            })
          ),

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

      return runQuery(query, rootValue).then(
        ({
          gene: {
            filtered_artworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
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
      return runQuery(query, rootValue).then(
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
      return runQuery(query, rootValue).then(({ node: { __id } }) => {
        expect(__id).toEqual(generatedId)
      })
    })
  })

  describe(`Pagination for the last page`, () => {
    beforeEach(() => {
      rootValue = {
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

      return runQuery(query, rootValue).then(({ filter_artworks }) => {
        expect(filter_artworks.artworks_connection.pageInfo).toEqual({
          hasNextPage: false,
        })
      })
    })
  })
})
