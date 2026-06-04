import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateCatalogEditionSetMutation", () => {
  const baseCatalogEditionSet = {
    id: "catalog-edition-set-id",
    edition_set_id: "some-edition-set",
    availability: "for sale",
    price_minor: 150000,
    price_currency: "USD",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  }

  describe("on success", () => {
    it("updates a catalog edition set", async () => {
      const updateCatalogEditionSetLoader = jest
        .fn()
        .mockResolvedValue(baseCatalogEditionSet)

      const mutation = gql`
        mutation {
          updateCatalogEditionSet(
            input: {
              editionSetID: "some-edition-set"
              availability: "for sale"
              priceCurrency: "USD"
              priceMinor: 150000
            }
          ) {
            catalogEditionSetOrError {
              __typename
              ... on UpdateCatalogEditionSetSuccess {
                catalogEditionSet {
                  internalID
                  editionSetId
                  availability
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogEditionSetLoader,
      })

      expect(updateCatalogEditionSetLoader).toHaveBeenCalledWith(
        "some-edition-set",
        {
          availability: "for sale",
          price_currency: "USD",
          price_minor: 150000,
        }
      )

      expect(result).toEqual({
        updateCatalogEditionSet: {
          catalogEditionSetOrError: {
            __typename: "UpdateCatalogEditionSetSuccess",
            catalogEditionSet: {
              internalID: "catalog-edition-set-id",
              editionSetId: "some-edition-set",
              availability: "for sale",
            },
          },
        },
      })
    })

    it("updates with partial fields", async () => {
      const updateCatalogEditionSetLoader = jest.fn().mockResolvedValue({
        ...baseCatalogEditionSet,
        availability: "sold",
      })

      const mutation = gql`
        mutation {
          updateCatalogEditionSet(
            input: { editionSetID: "some-edition-set", availability: "sold" }
          ) {
            catalogEditionSetOrError {
              ... on UpdateCatalogEditionSetSuccess {
                catalogEditionSet {
                  internalID
                  availability
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogEditionSetLoader,
      })

      expect(
        updateCatalogEditionSetLoader
      ).toHaveBeenCalledWith("some-edition-set", { availability: "sold" })

      expect(result).toEqual({
        updateCatalogEditionSet: {
          catalogEditionSetOrError: {
            catalogEditionSet: {
              internalID: "catalog-edition-set-id",
              availability: "sold",
            },
          },
        },
      })
    })

    it("returns priceListed as a Money type", async () => {
      const updateCatalogEditionSetLoader = jest
        .fn()
        .mockResolvedValue(baseCatalogEditionSet)

      const mutation = gql`
        mutation {
          updateCatalogEditionSet(
            input: { editionSetID: "some-edition-set", priceMinor: 150000 }
          ) {
            catalogEditionSetOrError {
              ... on UpdateCatalogEditionSetSuccess {
                catalogEditionSet {
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
        updateCatalogEditionSetLoader,
      })

      expect(result).toEqual({
        updateCatalogEditionSet: {
          catalogEditionSetOrError: {
            catalogEditionSet: {
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
    it("returns a mutation error when the edition set is not found", async () => {
      const updateCatalogEditionSetLoader = jest
        .fn()
        .mockRejectedValue(
          new Error(
            `https://stagingapi.artsy.net/api/v1/catalog_edition_set/bad-id - {"type":"error","message":"Edition set not found"}`
          )
        )

      const mutation = gql`
        mutation {
          updateCatalogEditionSet(input: { editionSetID: "bad-id" }) {
            catalogEditionSetOrError {
              __typename
              ... on UpdateCatalogEditionSetFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, {
        updateCatalogEditionSetLoader,
      })

      expect(result).toEqual({
        updateCatalogEditionSet: {
          catalogEditionSetOrError: {
            __typename: "UpdateCatalogEditionSetFailure",
            mutationError: {
              message: "Edition set not found",
            },
          },
        },
      })
    })

    it("throws when the loader is not available", async () => {
      const mutation = gql`
        mutation {
          updateCatalogEditionSet(input: { editionSetID: "some-edition-set" }) {
            catalogEditionSetOrError {
              ... on UpdateCatalogEditionSetSuccess {
                catalogEditionSet {
                  internalID
                }
              }
            }
          }
        }
      `

      await expect(
        runAuthenticatedQuery(mutation, {
          updateCatalogEditionSetLoader: undefined,
        })
      ).rejects.toThrow("You need to be signed in to perform this action")
    })
  })
})
