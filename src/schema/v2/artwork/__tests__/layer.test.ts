import { runQuery } from "schema/v2/test/utils"

describe("Layer type", () => {
  let artworksResponse
  let context

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

    context = {
      relatedLayerArtworksLoader: () => Promise.resolve(artworksResponse),
      artworkLoader: () => Promise.resolve({ id: "artwork" }),
      relatedLayersLoader: () => Promise.resolve([{ id: "main" }]),
    }
  })

  it("#artworks", async () => {
    const query = `
      {
        artwork(id:"lucio-fontana-concetto-spaziale-attese-139") {
          layers {
            artworks {
              slug 
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      artwork: {
        layers: [
          {
            artworks: artworksResponse.map(({ id, ...others }) => ({
              slug: id,
              ...others,
            })),
          },
        ],
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
                   slug 
                  }
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          layers: [
            {
              artworksConnection: {
                edges: [
                  {
                    node: {
                      slug: "leonor-fini-les-aveugles",
                    },
                  },
                  {
                    node: {
                      slug: "gregorio-vardanega-cereles-metaphorique",
                    },
                  },
                  {
                    node: {
                      slug: "joaquin-torres-garcia-grafismo-del-hombre-y-barco",
                    },
                  },
                ],
              },
            },
          ],
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

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          layers: [
            {
              artworksConnection: {
                pageInfo: {
                  hasNextPage: true,
                },
              },
            },
          ],
        },
      })
    })

    it("returns hasNextPage=false always", async () => {
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

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          layers: [
            {
              artworksConnection: {
                pageInfo: {
                  hasNextPage: false,
                },
              },
            },
          ],
        },
      })
    })
  })
})
