import { StaticPathLoader } from "lib/loaders/api/loader_interface"
import { runQuery } from "schema/v2/test/utils"
import { recentlySoldArtworks } from "../recentlySoldArtworks"

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
            }
          }
        }
      }
      `

    const context = {
      artworksLoader,
    }

    const response = await runQuery(query, context)
    const artworks = response.recentlySoldArtworks

    expect(artworks.edges).toHaveLength(recentlySoldArtworks.length)
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
              lowEstimate {
                display
              }
              highEstimate {
                display
              }
              priceRealized {
                display
              }
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
        internalID: "6219368ce4ed3d000dc4a7af",
      },
      lowEstimate: {
        display: "US$2,000",
      },
      highEstimate: {
        display: "US$3,000",
      },
      priceRealized: {
        display: "US$20,160",
      },
    })
  })
})
