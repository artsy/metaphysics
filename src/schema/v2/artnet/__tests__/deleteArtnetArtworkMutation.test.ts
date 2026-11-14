import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("deleteArtnetArtwork mutation", () => {
  const query = `
    mutation {
      deleteArtnetArtwork(input: { id: "artnet-artwork-1" }) {
        artnetArtworkOrError {
          ... on DeleteArtnetArtworkSuccess {
            artnetArtwork {
              internalID
              artnetId
            }
          }
          ... on DeleteArtnetArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("pushes the Delete to Gravity and returns the ArtnetArtwork", async () => {
    const deleteArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
      artnet_id: "artnet-1",
    })

    const data = await runAuthenticatedQuery(query, {
      deleteArtnetArtworkLoader,
    })

    expect(deleteArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1")
    expect(data).toEqual({
      deleteArtnetArtwork: {
        artnetArtworkOrError: {
          artnetArtwork: {
            internalID: "artnet-artwork-1",
            artnetId: "artnet-1",
          },
        },
      },
    })
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const deleteArtnetArtworkLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artnet_artwork/artnet-artwork-1 - {"type":"error","message":"ArtnetArtwork artnet-artwork-1 has not been linked to an Artnet artwork yet"}`
        )
      )

    const data = await runAuthenticatedQuery(query, {
      deleteArtnetArtworkLoader,
    })

    expect(data).toEqual({
      deleteArtnetArtwork: {
        artnetArtworkOrError: {
          mutationError: {
            message:
              "ArtnetArtwork artnet-artwork-1 has not been linked to an Artnet artwork yet",
          },
        },
      },
    })
  })

  it("requires the user to be signed in", async () => {
    await expect(runQuery(query, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
