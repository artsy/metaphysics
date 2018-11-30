import { runQuery } from "test/utils"

describe("Layer type", () => {
  let artworksResponse
  let rootValue

  beforeEach(() => {
    artworksResponse = [
      {
        id: "leonor-fini-les-aveugles",
      },
      {
        id: "gregorio-vardanega-cereles-metaphorique",
      },
      {
        id: "joaquin-torres-garcia-grafismo-del-hombre-y-barco",
      },
    ]

    rootValue = {
      relatedLayerArtworksLoader: () =>
        Promise.resolve({
          body: artworksResponse,
          headers: {
            "x-total-count": artworksResponse.length,
          },
        }),
    }
  })

  it("#artworks", async () => {
    const query = `
      {
        artwork(id:"lucio-fontana-concetto-spaziale-attese-139") {
          layers {
          }
        }
      }
    `

    const data = await runQuery(query, rootValue)

    expect(data).toEqual({
      artwork: {
        layers: {
          artworks: artworksResponse,
        },
      },
    })
  })

  describe("#artworksConnection", () => {
    it("returns artworks", async () => {
      const query = `
        {
          artwork(id:"lucio-fontana-concetto-spaziale-attese-139") {
            layers {
              artworksConnection(first:3) {
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

      const data = await runQuery(query, rootValue)

      expect(data).toEqual({
        artwork: {
          layers: {
            artworksConnection: {
              edges: [
                {
                  node: {
                    id: "leonor-fini-les-aveugles",
                  },
                },
                {
                  node: {
                    id: "gregorio-vardanega-cereles-metaphorique",
                  },
                },
                {
                  node: {
                    id: "joaquin-torres-garcia-grafismo-del-hombre-y-barco",
                  },
                },
              ],
            },
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          artwork(id:"lucio-fontana-concetto-spaziale-attese-139") {
            layers {
              artworksConnection(first:1) {
                pageInfo {
                  hasNextPage
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, rootValue)

      expect(data).toEqual({
        artwork: {
          layers: {
            artworksConnection: {
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          artwork(id:"lucio-fontana-concetto-spaziale-attese-139") {
            layers {
              artworksConnection(first:3) {
                pageInfo {
                  hasNextPage
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, rootValue)

      expect(data).toEqual({
        artwork: {
          layers: {
            artworksConnection: {
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        },
      })
    })
  })
})
