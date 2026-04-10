import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateCatalogArtworkMutation", () => {
  const baseCatalogArtwork = {
    id: "catalog-artwork-id",
    artwork_id: "some-artwork",
    medium: "Oil on canvas",
    availability: "for sale",
    price_currency: "USD",
    price_minor: 150000,
    private_notes: "Some private notes",
  }

  describe("on success", () => {
    it("creates a catalog artwork", async () => {
      const updateCatalogArtworkLoader = jest
        .fn()
        .mockResolvedValue(baseCatalogArtwork)

      const mutation = gql`
        mutation {
          updateCatalogArtwork(
            input: {
              artworkID: "some-artwork"
              medium: "Oil on canvas"
              availability: "for sale"
              priceCurrency: "USD"
              priceMinor: 150000
              privateNotes: "Some private notes"
            }
          ) {
            catalogArtworkOrError {
              __typename
              ... on UpdateCatalogArtworkSuccess {
                catalogArtwork {
                  internalID
                  artworkId
                  medium
                  availability
                  priceCurrency
                  privateNotes
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogArtworkLoader,
      })

      expect(updateCatalogArtworkLoader).toHaveBeenCalledWith("some-artwork", {
        medium: "Oil on canvas",
        availability: "for sale",
        price_currency: "USD",
        price_minor: 150000,
        private_notes: "Some private notes",
      })

      expect(result).toEqual({
        updateCatalogArtwork: {
          catalogArtworkOrError: {
            __typename: "UpdateCatalogArtworkSuccess",
            catalogArtwork: {
              internalID: "catalog-artwork-id",
              artworkId: "some-artwork",
              medium: "Oil on canvas",
              availability: "for sale",
              priceCurrency: "USD",
              privateNotes: "Some private notes",
            },
          },
        },
      })
    })

    it("updates an existing catalog artwork with partial fields", async () => {
      const updateCatalogArtworkLoader = jest.fn().mockResolvedValue({
        ...baseCatalogArtwork,
        availability: "sold",
      })

      const mutation = gql`
        mutation {
          updateCatalogArtwork(
            input: { artworkID: "some-artwork", availability: "sold" }
          ) {
            catalogArtworkOrError {
              ... on UpdateCatalogArtworkSuccess {
                catalogArtwork {
                  internalID
                  availability
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogArtworkLoader,
      })

      expect(updateCatalogArtworkLoader).toHaveBeenCalledWith("some-artwork", {
        availability: "sold",
      })

      expect(result).toEqual({
        updateCatalogArtwork: {
          catalogArtworkOrError: {
            catalogArtwork: {
              internalID: "catalog-artwork-id",
              availability: "sold",
            },
          },
        },
      })
    })

    it("returns priceListed as a Money type", async () => {
      const updateCatalogArtworkLoader = jest
        .fn()
        .mockResolvedValue(baseCatalogArtwork)

      const mutation = gql`
        mutation {
          updateCatalogArtwork(
            input: {
              artworkID: "some-artwork"
              priceCurrency: "USD"
              priceMinor: 150000
            }
          ) {
            catalogArtworkOrError {
              ... on UpdateCatalogArtworkSuccess {
                catalogArtwork {
                  priceListed {
                    major
                    minor
                    currencyCode
                    display
                  }
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogArtworkLoader,
      })

      expect(result).toEqual({
        updateCatalogArtwork: {
          catalogArtworkOrError: {
            catalogArtwork: {
              priceListed: {
                major: 1500,
                minor: 150000,
                currencyCode: "USD",
                display: "US$1,500",
              },
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    it("returns a mutation error when the artwork is not found", async () => {
      const updateCatalogArtworkLoader = jest
        .fn()
        .mockRejectedValue(
          new Error(
            `https://stagingapi.artsy.net/api/v1/catalog_artwork/bad-id - {"type":"error","message":"Artwork not found"}`
          )
        )

      const mutation = gql`
        mutation {
          updateCatalogArtwork(input: { artworkID: "bad-id" }) {
            catalogArtworkOrError {
              __typename
              ... on UpdateCatalogArtworkFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogArtworkLoader,
      })

      expect(result).toEqual({
        updateCatalogArtwork: {
          catalogArtworkOrError: {
            __typename: "UpdateCatalogArtworkFailure",
            mutationError: {
              message: "Artwork not found",
            },
          },
        },
      })
    })

    it("throws when the loader is not available", async () => {
      const mutation = gql`
        mutation {
          updateCatalogArtwork(input: { artworkID: "some-artwork" }) {
            catalogArtworkOrError {
              ... on UpdateCatalogArtworkSuccess {
                catalogArtwork {
                  internalID
                }
              }
            }
          }
        }
      `

      await expect(
        runAuthenticatedQuery(mutation, {
          updateCatalogArtworkLoader: undefined,
        })
      ).rejects.toThrow("You need to be signed in to perform this action")
    })
  })
})
