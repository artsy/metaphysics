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

  it("passes priceFromMinor through as Gravity's price_from_minor", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", priceFromMinor: 500000 }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `
    const updateArtnetArtworkLoader = jest
      .fn()
      .mockResolvedValue({ id: "artnet-artwork-1" })

    await runAuthenticatedQuery(query, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      price_from_minor: 500000,
    })
  })

  it("passes primaryMedium and additionalMediums through to Gravity", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: {
            id: "artnet-artwork-1"
            primaryMedium: "Sculpture"
            additionalMediums: ["Paintings"]
          }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                primaryMedium
                additionalMediums
              }
            }
          }
        }
      }
    `
    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
      primary_medium: "Sculpture",
      additional_mediums: ["Paintings"],
    })

    const data = await runAuthenticatedQuery(query, {
      updateArtnetArtworkLoader,
    })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      primary_medium: "Sculpture",
      additional_mediums: ["Paintings"],
    })
    expect(
      data.updateArtnetArtwork.artnetArtworkOrError.artnetArtwork
    ).toEqual({ primaryMedium: "Sculpture", additionalMediums: ["Paintings"] })
  })

  // An empty list removes every additional medium, but qs drops empty arrays
  // from the request, so it reaches Gravity as null rather than not at all.
  it("sends an empty additionalMediums to Gravity as null", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", additionalMediums: [] }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `
    const updateArtnetArtworkLoader = jest
      .fn()
      .mockResolvedValue({ id: "artnet-artwork-1" })

    await runAuthenticatedQuery(query, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      additional_mediums: null,
    })
  })

  it("passes materials, priceToMinor and syncOn through", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: {
            id: "artnet-artwork-1"
            materials: "Oil on canvas"
            priceToMinor: 500000
            syncOn: true
          }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
    })

    await runAuthenticatedQuery(query, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      materials: "Oil on canvas",
      sync_on: true,
      price_to_minor: 500000,
    })
  })

  it("sends price_to_minor as null to clear it", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", priceToMinor: null, syncOn: true }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
    })

    await runAuthenticatedQuery(query, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      sync_on: true,
      price_to_minor: null,
    })
  })

  it("omits price_to_minor entirely when it is not provided", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", syncOn: true }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
    })

    await runAuthenticatedQuery(query, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      sync_on: true,
    })
    // toHaveBeenCalledWith treats an undefined value as a missing key, so this
    // is what actually proves omitBy ran.
    expect(updateArtnetArtworkLoader.mock.calls[0][1]).not.toHaveProperty(
      "price_to_minor"
    )
  })

  it("refuses a priceToMinor it cannot read rather than clearing the price", async () => {
    const badQuery = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", priceToMinor: "not a number" }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn()

    await expect(
      runAuthenticatedQuery(badQuery, { updateArtnetArtworkLoader })
    ).rejects.toThrow(/priceToMinor/)

    expect(updateArtnetArtworkLoader).not.toHaveBeenCalled()
  })

  it("returns what the push could not send to Artnet", async () => {
    const skippedQuery = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", syncOn: true }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              artnetArtwork {
                internalID
              }
              skipped {
                field
                reason
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
      skipped: [
        { field: "price", reason: "Currency 'XYZ' is not accepted by Artnet" },
      ],
    })

    const data = await runAuthenticatedQuery(skippedQuery, {
      updateArtnetArtworkLoader,
    })

    expect(data).toEqual({
      updateArtnetArtwork: {
        artnetArtworkOrError: {
          artnetArtwork: { internalID: "artnet-artwork-1" },
          skipped: [
            {
              field: "price",
              reason: "Currency 'XYZ' is not accepted by Artnet",
            },
          ],
        },
      },
    })
  })

  it("returns an empty skipped list when Gravity sends none", async () => {
    const skippedQuery = `
      mutation {
        updateArtnetArtwork(
          input: { id: "artnet-artwork-1", syncOn: true }
        ) {
          artnetArtworkOrError {
            ... on UpdateArtnetArtworkSuccess {
              skipped {
                field
              }
            }
          }
        }
      }
    `

    const updateArtnetArtworkLoader = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
    })

    const data = await runAuthenticatedQuery(skippedQuery, {
      updateArtnetArtworkLoader,
    })

    expect(data).toEqual({
      updateArtnetArtwork: {
        artnetArtworkOrError: { skipped: [] },
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
