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
      materials: undefined,
      sync_on: true,
      synced_fields: undefined,
      synced_edition_set_id: undefined,
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

  it("passes materials, priceToMinor, syncedFields and syncedEditionSetId through", async () => {
    const query = `
      mutation {
        updateArtnetArtwork(
          input: {
            id: "artnet-artwork-1"
            materials: "Oil on canvas"
            priceToMinor: 500000
            syncOn: true
            syncedFields: [PRICE, AVAILABILITY]
            syncedEditionSetId: "edition-set-1"
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
      published: undefined,
      availability: undefined,
      materials: "Oil on canvas",
      sync_on: true,
      synced_fields: ["price", "availability"],
      synced_edition_set_id: "edition-set-1",
      price_to_minor: 500000,
    })
  })

  it("sends price_to_minor as null to clear it, and omits the key entirely when not provided", async () => {
    const clearQuery = `
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

    await runAuthenticatedQuery(clearQuery, { updateArtnetArtworkLoader })

    expect(updateArtnetArtworkLoader).toHaveBeenCalledWith("artnet-artwork-1", {
      published: undefined,
      availability: undefined,
      materials: undefined,
      sync_on: true,
      synced_fields: undefined,
      synced_edition_set_id: undefined,
      price_to_minor: null,
    })

    const omitQuery = `
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

    const updateArtnetArtworkLoader2 = jest.fn().mockResolvedValue({
      id: "artnet-artwork-1",
    })

    await runAuthenticatedQuery(omitQuery, {
      updateArtnetArtworkLoader: updateArtnetArtworkLoader2,
    })

    expect(updateArtnetArtworkLoader2).toHaveBeenCalledWith(
      "artnet-artwork-1",
      {
        published: undefined,
        availability: undefined,
        materials: undefined,
        sync_on: true,
        synced_fields: undefined,
        synced_edition_set_id: undefined,
      }
    )
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
