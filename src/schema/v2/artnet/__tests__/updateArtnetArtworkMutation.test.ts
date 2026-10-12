import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateArtnetArtwork mutation", () => {
  const query = `
    mutation {
      updateArtnetArtwork(
        input: {
          id: "artnet-artwork-1"
          published: false
          availability: "sold"
          syncOn: true
        }
      ) {
        artnetArtworkOrError {
          ... on UpdateArtnetArtworkSuccess {
            artnetArtwork {
              internalID
              availability
              published
            }
          }
          ... on UpdateArtnetArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the ArtnetArtwork", async () => {
    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
      availability: "Sold",
      published: false,
    })

    const data = await runAuthenticatedQuery(query, {
      updateArtnetArtworkLoader,
    })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      published: false,
      availability: "sold",
      sync_on: true,
    })
    expect(data).toEqual({
      updateArtnetArtwork: {
        artnetArtworkOrError: {
          artnetArtwork: {
            internalID: "artnet-artwork-1",
            availability: "Sold",
            published: false,
          },
        },
      },
    })
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const updateArtnetArtworkLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artnet_artwork/artnet-artwork-1 - {"type":"error","message":"Artwork is not in Artnet"}`
        )
      )

    const data = await runAuthenticatedQuery(query, {
      updateArtnetArtworkLoader,
    })

    expect(data).toEqual({
      updateArtnetArtwork: {
        artnetArtworkOrError: {
          mutationError: { message: "Artwork is not in Artnet" },
        },
      },
    })
  })
})
