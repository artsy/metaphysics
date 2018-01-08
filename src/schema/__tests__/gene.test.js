import schema from "schema"
import { runQuery } from "test/utils"

describe("Gene", () => {
  describe("For just querying the gene artworks", () => {
    const Gene = schema.__get__("Gene")
    const filterArtworks = Gene.__get__("filterArtworks")

    // If this test fails because it's making a gravity request to /gene/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    beforeEach(() => {
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      gravity
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
        )
      filterArtworks.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      filterArtworks.__ResetDependency__("gravity")
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

      return runQuery(query).then(({ gene: { filtered_artworks: { hits } } }) => {
        expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
      })
    })
  })

  describe("artworks_connection", () => {
    const Gene = schema.__get__("Gene")

    beforeEach(() => {
      Gene.__ResetDependency__("gravity")
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      const gene = { id: "500-1000-ce", browseable: true, family: "" }
      gravity
        // Gene
        .onCall(0)
        .returns(Promise.resolve(Object.assign({}, gene)))
        // 20 artworks
        .onCall(1)
        .returns(
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
        )

      Gene.__Rewire__("gravity", gravity)
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

      return runQuery(query).then(data => {
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

      return runQuery(query).then(data => {
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

      return runQuery(query).then(data => {
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
    const Gene = schema.__get__("Gene")

    beforeEach(() => {
      Gene.__ResetDependency__("gravity")
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      const gene = {
        id: "500-1000-ce",
        browseable: true,
        family: "",
        counts: { artists: 20 },
      }
      gravity
        // Gene
        .onCall(0)
        .returns(Promise.resolve(Object.assign({}, gene)))
        // 20 artworks
        .onCall(1)
        .returns(Promise.resolve(Array(20)))

      Gene.__Rewire__("gravity", gravity)
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

      return runQuery(query).then(data => {
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

      return runQuery(query).then(data => {
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
    const Gene = schema.__get__("Gene")

    beforeEach(() => {
      Gene.__ResetDependency__("gravity")
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      const gene = {
        id: "500-1000-ce",
        browseable: true,
        family: "",
        counts: { artists: 20 },
      }

      gravity.onCall(0).returns(Promise.resolve(Object.assign({}, gene)))

      Gene.__Rewire__("gravity", gravity)
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

      const rootValue = {
        similarGenesLoader: () =>
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
          }),
      }

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
    const Gene = schema.__get__("Gene")
    const filterArtworks = Gene.__get__("filterArtworks")

    beforeEach(() => {
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      gravity
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
        )

      const gene = { id: "500-1000-ce", browseable: true, family: "" }
      Gene.__Rewire__("gravity", sinon.stub().returns(Promise.resolve(gene)))
      filterArtworks.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      filterArtworks.__ResetDependency__("gravity")
      Gene.__ResetDependency__("gravity")
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

      return runQuery(query).then(({ gene: { filtered_artworks: { hits } } }) => {
        expect(hits).toEqual([{ id: "oseberg-norway-queens-ship" }])
      })
    })
  })
})
