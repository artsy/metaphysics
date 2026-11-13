/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Artist representativeArtworks", () => {
  const query = gql`
    {
      artist(id: "andy-warhol") {
        representativeArtworks {
          internalID
        }
      }
    }
  `

  it("resolves representative_artwork_ids through the artwork-by-id loader", async () => {
    const load = jest.fn((id: string) => Promise.resolve({ _id: id }))
    const context = {
      artistLoader: () =>
        Promise.resolve({
          _id: "123",
          id: "andy-warhol",
          representative_artwork_ids: ["art-1", "art-2"],
        }),
      artworkByIDLoader: { load },
    } as any

    const data = await runQuery(query, context)

    expect(data.artist.representativeArtworks).toEqual([
      { internalID: "art-1" },
      { internalID: "art-2" },
    ])
    expect(load).toHaveBeenCalledTimes(2)
  })

  it("returns [] without touching the loader when there are no ids", async () => {
    const load = jest.fn()
    const context = {
      artistLoader: () =>
        Promise.resolve({
          _id: "123",
          id: "andy-warhol",
          representative_artwork_ids: [],
        }),
      artworkByIDLoader: { load },
    } as any

    const data = await runQuery(query, context)

    expect(data.artist.representativeArtworks).toEqual([])
    expect(load).not.toHaveBeenCalled()
  })
})
