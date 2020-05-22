import { runQuery } from "schema/v2/test/utils"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"

describe("TargetSupply", () => {
  describe("microfunnel", () => {
    const echoingArtistLoader = (slug) => {
      return Promise.resolve({
        id: slug,
        slug,
      })
    }
    const echoingArtworksLoader: StaticPathLoader<any> = (keys) => {
      const ids = keys?.ids || []
      return Promise.resolve(
        ids.map((id) => {
          return {
            _id: id,
          }
        })
      )
    }

    it("returns all artists in the microfunnel", async () => {
      const query = `
      {
        targetSupply {
          microfunnel {
            artist {
              slug
            }
          }
        }
      }
      `

      const context = {
        artistLoader: echoingArtistLoader,
      }

      const response = await runQuery(query, context)
      const artists = response.targetSupply.microfunnel
      expect(artists).toHaveLength(19)
      expect(artists.map((x) => x.artist.slug)).toContain("banksy")
    })

    it("returns metadata for items in the microfunnel", async () => {
      const query = `
      {
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
            artist {
              slug
            }
          }
        }
      }
    `

      const context = {
        artistLoader: echoingArtistLoader,
        artworksLoader: echoingArtworksLoader,
      }

      const response = await runQuery(query, context)

      const banksy = response.targetSupply.microfunnel.find(
        (x) => x.artist.slug === "banksy"
      )

      expect(banksy.metadata).toEqual({
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
      })
    })

    it("returns artworks for items in the microfunnel", async () => {
      const query = `
      {
        targetSupply {
          microfunnel {
            artist {
              slug
            }
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
    `

      const context = {
        artistLoader: echoingArtistLoader,
        artworksLoader: echoingArtworksLoader,
      }

      const response = await runQuery(query, context)

      const banksy = response.targetSupply.microfunnel.find(
        (x) => x.artist.slug === "banksy"
      )
      const artworks = banksy.artworksConnection.edges
      expect(artworks).toEqual(
        expect.arrayContaining([
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
        ])
      )
    })
  })
})
