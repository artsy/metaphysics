import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportCurrencyMutation", () => {
  const artworkImportID = "artwork-import-id"
  const fromCurrency = "USD"
  const toCurrency = "EUR"

  const mutation = gql`
    mutation {
      updateArtworkImportCurrency(
        input: {
          artworkImportID: "artwork-import-id"
          fromCurrency: "USD"
          toCurrency: "EUR"
        }
      ) {
        updateArtworkImportCurrencyOrError {
          ... on UpdateArtworkImportCurrencySuccess {
            artworkImport {
              internalID
            }
          }
          ... on UpdateArtworkImportCurrencyFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("updates artwork import currency", async () => {
    const mockArtworkImport = {
      id: artworkImportID,
    }

    const mockLoader = jest.fn().mockResolvedValue(mockArtworkImport)

    const context = {
      artworkImportUpdateCurrencyLoader: mockLoader,
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockLoader).toHaveBeenCalledWith(artworkImportID, {
      from_currency: fromCurrency,
      to_currency: toCurrency,
    })

    expect(result).toEqual({
      updateArtworkImportCurrency: {
        updateArtworkImportCurrencyOrError: {
          artworkImport: {
            internalID: artworkImportID,
          },
        },
      },
    })
  })

  it("returns an error when loader throws", async () => {
    const mockLoader = jest
      .fn()
      .mockRejectedValue(new Error("Currency update failed"))

    const context = {
      artworkImportUpdateCurrencyLoader: mockLoader,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Currency update failed"
    )
  })
})
