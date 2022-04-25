import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { runQuery } from "schema/v2/test/utils"

describe("RecentlySoldArtworks", () => {
  const artworksLoader: StaticPathLoader<any> = (params) => {
    const ids = params && params.ids ? params.ids : []
    return Promise.resolve(
      ids.map((id) => ({
        _id: id,
      }))
    )
  }

  it("returns all artworks", async () => {
    const query = `
      {
        recentlySoldArtworks {
          edges {
            node {
              artwork {
                internalID
              }
              lowEstimateUSD
              highEstimateUSD
              priceRealized
            }
          }
        }
      }
      `

    const context = {
      artworksLoader,
    }

    const response = await runQuery(query, context)
    const recentlySoldArtworks = response.recentlySoldArtworks

    expect(recentlySoldArtworks.edges).toHaveLength(20)
  })

  it("returns correct artwork", async () => {
    const query = `
      {
        recentlySoldArtworks(first: 1) {
          edges {
            node {
              artwork {
                internalID
              }
              lowEstimateUSD
              highEstimateUSD
              priceRealized
            }
          }
        }
      }
      `

    const context = {
      artworksLoader,
    }

    const response = await runQuery(query, context)
    const recentlySoldArtworks = response.recentlySoldArtworks

    expect(recentlySoldArtworks.edges).toHaveLength(1)
    expect(recentlySoldArtworks.edges[0].node).toEqual({
      artwork: {
        internalID: "622bdb23c6df37000d516d7b",
      },
      lowEstimateUSD: "150,000",
      highEstimateUSD: "200,000",
      priceRealized: "350,000",
    })
  })
})
