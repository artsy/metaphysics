import { runQuery } from "schema/v2/test/utils"

describe("ArtOSDownstreamArtworks", () => {
  it("passes userID, token, and pagination args through to the loader", async () => {
    const artOSDownstreamArtworksLoader = jest.fn(() =>
      Promise.resolve({ artworks: [{ id: "artwork-1" }] })
    )

    const query = `
      {
        artOSDownstreamArtworks(userID: "user-1", token: "a-token", page: 2, pageSize: 5)
      }
    `

    const data = await runQuery(query, { artOSDownstreamArtworksLoader })

    expect(artOSDownstreamArtworksLoader).toHaveBeenCalledWith({
      user_id: "user-1",
      token: "a-token",
      page: 2,
      page_size: 5,
    })
    expect(data.artOSDownstreamArtworks).toEqual({
      artworks: [{ id: "artwork-1" }],
    })
  })

  it("works with no args", async () => {
    const artOSDownstreamArtworksLoader = jest.fn(() =>
      Promise.resolve({ artworks: [] })
    )

    const query = `
      {
        artOSDownstreamArtworks
      }
    `

    await runQuery(query, { artOSDownstreamArtworksLoader })

    expect(artOSDownstreamArtworksLoader).toHaveBeenCalledWith({
      user_id: undefined,
      token: undefined,
      page: undefined,
      page_size: undefined,
    })
  })
})
