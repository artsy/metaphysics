import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createArtnetArtwork mutation", () => {
  const query = `
    mutation {
      createArtnetArtwork(
        input: { artworkID: "artwork-1", artnetArtistID: 42, published: true }
      ) {
        artnetArtworkOrError {
          ... on CreateArtnetArtworkSuccess {
            artnetArtwork {
              internalID
              availability
              published
            }
          }
          ... on CreateArtnetArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates the ArtnetArtwork", async () => {
    const createArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
      availability: "For Sale",
      published: true,
    })

    const data = await runAuthenticatedQuery(query, {
      createArtnetArtworkLoader,
    })

    expect(createArtnetArtworkLoader).toHaveBeenCalledWith({
      artwork_id: "artwork-1",
      artnet_artist_id: 42,
      published: true,
    })
    expect(data).toEqual({
      createArtnetArtwork: {
        artnetArtworkOrError: {
          artnetArtwork: {
            internalID: "artnet-artwork-1",
            availability: "For Sale",
            published: true,
          },
        },
      },
    })
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const createArtnetArtworkLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artnet_artwork - {"type":"error","message":"Artwork already has an Artnet artwork"}`
        )
      )

    const data = await runAuthenticatedQuery(query, {
      createArtnetArtworkLoader,
    })

    expect(data).toEqual({
      createArtnetArtwork: {
        artnetArtworkOrError: {
          mutationError: {
            message: "Artwork already has an Artnet artwork",
          },
        },
      },
    })
  })
})
