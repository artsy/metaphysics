import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateArtnetEditionSet mutation", () => {
  const query = `
    mutation {
      updateArtnetEditionSet(
        input: {
          id: "artnet-edition-set-1"
          priceMinor: 100000
          priceCurrency: "USD"
          saleStatus: FOR_SALE
        }
      ) {
        artnetEditionSetOrError {
          ... on UpdateArtnetEditionSetSuccess {
            artnetEditionSet {
              internalID
              availability
            }
          }
          ... on UpdateArtnetEditionSetFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the ArtnetEditionSet", async () => {
    const updateArtnetEditionSetLoader = jest.fn().mockResolvedValue({
      id: "artnet-edition-set-1",
      availability: "For Sale",
    })

    const data = await runAuthenticatedQuery(query, {
      updateArtnetEditionSetLoader,
    })

    expect(updateArtnetEditionSetLoader).toHaveBeenCalledWith(
      "artnet-edition-set-1",
      {
        price_minor: 100000,
        price_currency: "USD",
        sale_status: "For Sale",
      }
    )
    expect(data).toEqual({
      updateArtnetEditionSet: {
        artnetEditionSetOrError: {
          artnetEditionSet: {
            internalID: "artnet-edition-set-1",
            availability: "For Sale",
          },
        },
      },
    })
  })

  it("sends price_minor and price_currency as null to hand the price back, and omits them when not provided", async () => {
    const clearQuery = `
      mutation {
        updateArtnetEditionSet(
          input: {
            id: "artnet-edition-set-1"
            priceMinor: null
            priceCurrency: null
          }
        ) {
          artnetEditionSetOrError {
            ... on UpdateArtnetEditionSetSuccess {
              artnetEditionSet {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetEditionSetLoader = jest.fn().mockResolvedValue({
      id: "artnet-edition-set-1",
    })

    await runAuthenticatedQuery(clearQuery, { updateArtnetEditionSetLoader })

    expect(updateArtnetEditionSetLoader).toHaveBeenCalledWith(
      "artnet-edition-set-1",
      {
        price_minor: null,
        price_currency: null,
        sale_status: undefined,
      }
    )

    const omitQuery = `
      mutation {
        updateArtnetEditionSet(
          input: { id: "artnet-edition-set-1", saleStatus: SOLD }
        ) {
          artnetEditionSetOrError {
            ... on UpdateArtnetEditionSetSuccess {
              artnetEditionSet {
                internalID
              }
            }
          }
        }
      }
    `

    const updateArtnetEditionSetLoader2 = jest.fn().mockResolvedValue({
      id: "artnet-edition-set-1",
    })

    await runAuthenticatedQuery(omitQuery, {
      updateArtnetEditionSetLoader: updateArtnetEditionSetLoader2,
    })

    expect(updateArtnetEditionSetLoader2).toHaveBeenCalledWith(
      "artnet-edition-set-1",
      {
        sale_status: "Sold",
      }
    )
  })

  it("returns a mutation error when Gravity rejects the request", async () => {
    const updateArtnetEditionSetLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artnet_edition_set/artnet-edition-set-1 - {"type":"error","message":"An edition's price needs price_minor and price_currency together, or neither"}`
        )
      )

    const data = await runAuthenticatedQuery(query, {
      updateArtnetEditionSetLoader,
    })

    expect(data).toEqual({
      updateArtnetEditionSet: {
        artnetEditionSetOrError: {
          mutationError: {
            message:
              "An edition's price needs price_minor and price_currency together, or neither",
          },
        },
      },
    })
  })
})
