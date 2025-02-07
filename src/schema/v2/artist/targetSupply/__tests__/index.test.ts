import { runQuery } from "schema/v2/test/utils"

describe("ArtistTargetSupply", () => {
  describe("isTargetSupply", () => {
    it("returns boolean if in target supply", async () => {
      const query = `
      {
        artist(id:"andy-warhol") {
          targetSupply {
            isTargetSupply
          }
        }
      }
    `
      const context = {
        artistLoader: () => {
          return Promise.resolve({
            id: "andy-warhol",
            target_supply: false,
          })
        },
      }
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isTargetSupply).toEqual(false)
    })
  })

  describe("isP1", () => {
    let targetSupplyPriority: number | null

    const query = `
      {
        artist(id:"andy-warhol") {
          targetSupply {
            isP1
          }
        }
      }
    `
    const context = {
      artistLoader: () => {
        return Promise.resolve({
          id: "andy-warhol",
          target_supply_priority: targetSupplyPriority,
        })
      },
    }

    it("returns true if target_supply_priority is 1", async () => {
      targetSupplyPriority = 1
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isP1).toEqual(false)
    })

    it("returns false if target_supply_priority is 2", async () => {
      targetSupplyPriority = 2
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isP1).toEqual(false)
    })

    it("returns false if target_supply_priority is null", async () => {
      targetSupplyPriority = null
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isP1).toEqual(false)
    })
  })

  describe("isInMicrofunnel", () => {
    it("returns false if artist not in microfunnel", async () => {
      const query = `
      {
        artist(id:"andy-warhol") {
          targetSupply {
            isInMicrofunnel
          }
        }
      }
    `
      const context = {
        artistLoader: () => {
          return Promise.resolve({
            id: "andy-warhol",
          })
        },
      }
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isInMicrofunnel).toEqual(false)
    })

    it("returns true if artist in microfunnel", async () => {
      const query = `
        {
          artist(id:"alex-katz") {
            targetSupply {
              isInMicrofunnel
            }
          }
        }
      `
      const context = {
        artistLoader: () => {
          return Promise.resolve({
            id: "alex-katz",
          })
        },
      }
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply.isInMicrofunnel).toEqual(true)
    })
  })

  describe("#microfunnel", () => {
    it("returns null if artist not in microfunnel", async () => {
      const query = `
        {
          artist(id:"andy-warhol") {
            targetSupply {
              microfunnel {
                metadata {
                  highestRealized
                }
              }
            }
          }
        }
      `
      const context = {
        artistLoader: () => {
          return Promise.resolve({
            id: "andy-warhol",
          })
        },
      }
      const response = await runQuery(query, context)
      expect(response.artist.targetSupply).toEqual({
        microfunnel: null,
      })
    })

    describe("#metadata", () => {
      it("returns metadata", async () => {
        const query = `
        {
          artist(id:"alex-katz") {
            targetSupply {
              microfunnel {
                metadata {
                  highestRealized
                  realized
                  recentlySoldArtworkIDs
                  roundedUniqueVisitors
                  roundedViews
                  str
                  uniqueVisitors
                  views
                }
              }
            }
          }
        }
      `
        const context = {
          artistLoader: () => {
            return Promise.resolve({
              id: "banksy",
              name: "Banksy",
            })
          },
          artworksLoader: () => {
            return Promise.resolve([
              {
                _id: "5e3854df108c9200113cd354",
              },
              {
                _id: "5e3854d523363e000f352f7f",
              },
              {
                _id: "5e3854cf20273e00122131a5",
              },
              {
                _id: "5e3854ce662102000e73328f",
              },
              {
                _id: "59d6a884c9dc240f49917380",
              },
              {
                _id: "5de86d009a893d001244f5fe",
              },
              {
                _id: "5dcdc5a4f78568000ede76dc",
              },
            ])
          },
        }
        const response = await runQuery(query, context)
        expect(response.artist.targetSupply).toEqual({
          microfunnel: {
            metadata: {
              highestRealized: "12.16M",
              realized: "184%",
              recentlySoldArtworkIDs: [
                "5e3854df108c9200113cd354",
                "5e3854d523363e000f352f7f",
                "5e3854cf20273e00122131a5",
                "5e3854ce662102000e73328f",
                "59d6a884c9dc240f49917380",
                "5de86d009a893d001244f5fe",
                "5dcdc5a4f78568000ede76dc",
              ],
              roundedUniqueVisitors: "5,600",
              roundedViews: "16,000",
              str: "95%",
              uniqueVisitors: "5,610",
              views: "16,159",
            },
          },
        })
      })
    })

    describe("#artworksConnection", () => {
      it("returns a list of artworks", async () => {
        const query = `
          {
            artist(id:"alex-katz") {
              targetSupply {
                microfunnel {
                  artworksConnection {
                    edges {
                      node {
                        internalID
                        realizedPrice
                      }
                    }
                  }
                }
              }
            }
          }
        `
        const context = {
          artistLoader: () => {
            return Promise.resolve({
              id: "banksy",
              name: "Banksy",
            })
          },
          artworksLoader: () => {
            return Promise.resolve([
              {
                _id: "5e3854df108c9200113cd354",
              },
              {
                _id: "5e3854d523363e000f352f7f",
              },
            ])
          },
        }
        const response = await runQuery(query, context)
        expect(response.artist.targetSupply).toEqual({
          microfunnel: {
            artworksConnection: {
              edges: [
                {
                  node: {
                    internalID: "5e3854df108c9200113cd354",
                    realizedPrice: "$41,595",
                  },
                },
                {
                  node: {
                    internalID: "5e3854d523363e000f352f7f",
                    realizedPrice: "$36,395",
                  },
                },
              ],
            },
          },
        })
      })
    })
  })
})
