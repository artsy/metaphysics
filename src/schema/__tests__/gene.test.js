/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

describe("Gene", () => {
  let rootValue
  describe("For just querying the gene artworks", () => {
    // If this test fails because it's making a gravity request to /gene/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    beforeEach(() => {
      rootValue = {
        filterArtworksLoader: sinon
          .stub()
          .withArgs("filter/artworks", {
            gene_id: "500-1000-ce",
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
    })

    it("returns filtered artworks", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
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
          gene: {
            filtered_artworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
        }
      )
    })
  })

  describe("artworks_connection", () => {
    beforeEach(() => {
      const gene = { id: "500-1000-ce", browseable: true, family: "" }
      rootValue = {
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
        filterArtworksLoader: sinon.stub().returns(
          Promise.resolve({
            hits: Array(20),
            aggregations: {
              total: {
                value: 20,
              },
              medium: {
                painting: { name: "Painting", count: 16 },
                photography: { name: "Photography", count: 4 },
              },
            },
          })
        ),
      }
    })

    it("does not have a next page when the requested amount exceeds the count", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            artworks_connection(first: 40) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            artworks_connection: {
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        })
      })
    })

    it("has a next page when the amount requested is less than the count", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            artworks_connection(first: 10) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            artworks_connection: {
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        })
      })
    })

    it("exposes aggregation metadata", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            artworks_connection(aggregations: [MEDIUM], first: 10) {
              counts {
                total
              }
              aggregations {
                slice
                counts {
                  id
                  count
                  name
                }
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            artworks_connection: {
              counts: {
                total: 20,
              },
              aggregations: [
                {
                  slice: "MEDIUM",
                  counts: [
                    {
                      id: "painting",
                      count: 16,
                      name: "Painting",
                    },
                    {
                      id: "photography",
                      count: 4,
                      name: "Photography",
                    },
                  ],
                },
              ],
            },
          },
        })
      })
    })
  })

  describe("arist_connection", () => {
    beforeEach(() => {
      const gene = {
        id: "500-1000-ce",
        browseable: true,
        family: "",
        counts: { artists: 20 },
      }

      rootValue = {
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
        geneArtistsLoader: sinon.stub().returns(Promise.resolve(Array(20))),
      }
    })

    it("does not have a next page when the requested amount exceeds the count", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            artists_connection(first: 40) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            artists_connection: {
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        })
      })
    })

    it("has a next page when the amount requested is less than the count", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            artists_connection(first: 10) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            artists_connection: {
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        })
      })
    })
  })

  describe("similar", () => {
    beforeEach(() => {
      const gene = {
        id: "500-1000-ce",
        browseable: true,
        family: "",
        counts: { artists: 20 },
      }

      rootValue = {
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
      }
    })

    it("returns similar genes", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            similar(first: 1) {
              edges {
                node {
                  id
                  name
                }
              }
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      rootValue.similarGenesLoader = sinon.stub().returns(
        Promise.resolve({
          body: [
            {
              id: "pop-art",
              name: "Pop Art",
              browseable: true,
              family: "",
              counts: { artists: 20 },
            },
          ],
          headers: {
            "x-total-count": 1,
          },
        })
      )

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          gene: {
            similar: {
              edges: [
                {
                  node: {
                    id: "pop-art",
                    name: "Pop Art",
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        })
      })
    })
  })

  // The key distinction here is that because the query contains
  // metadata about the gene, then gravity will have to be called,
  // and in the test mocked out. Whereas above, it does not need
  // to happen.

  describe("For querying the gene artworks + gene metadata", () => {
    beforeEach(() => {
      const gene = { id: "500-1000-ce", browseable: true, family: "" }
      rootValue = {
        filterArtworksLoader: sinon
          .stub()
          .withArgs("filter/artworks", {
            gene_id: "500-1000-ce",
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
        geneLoader: sinon.stub().returns(Promise.resolve(gene)),
      }
    })

    it("returns filtered artworks, and makes a gravity call", () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
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
          gene: {
            filtered_artworks: { hits },
          },
        }) => {
          expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
        }
      )
    })
  })

  describe("is_followed", () => {
    let gravityLoader
    let followedGeneLoader

    beforeEach(() => {
      gravityLoader = jest.fn(() =>
        Promise.resolve([
          { gene: { id: "brooklyn-artists", name: "Brooklyn Artists" } },
        ])
      )
      followedGeneLoader = trackedEntityLoaderFactory(
        gravityLoader,
        "genes",
        "is_followed",
        "gene"
      )
    })

    it("returns true if gene is returned", () => {
      return followedGeneLoader("brooklyn-artists").then(gene => {
        expect(gene.is_followed).toBe(true)
      })
    })

    it("returns false if gene is not returned", () => {
      return followedGeneLoader("new-york-artists").then(gene => {
        expect(gene.is_followed).toBe(false)
      })
    })
  })
})
