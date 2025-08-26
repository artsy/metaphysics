import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportV2Mutation", () => {
  it("updates artwork import status successfully", async () => {
    const artworkImportV2UpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      state: "canceled",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportV2(
          input: { artworkImportID: "artwork-import-1", status: "cancelled" }
        ) {
          updateArtworkImportV2OrError {
            ... on UpdateArtworkImportV2Success {
              artworkImport {
                internalID
                state
              }
            }
          }
        }
      }
    `

    const context = { artworkImportV2UpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        status: "cancelled",
      }
    )

    expect(result).toEqual({
      updateArtworkImportV2: {
        updateArtworkImportV2OrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            state: "CANCELED",
          },
        },
      },
    })
  })

  it("updates artwork import currency successfully", async () => {
    const artworkImportV2UpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      currency: "EUR",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportV2(
          input: { artworkImportID: "artwork-import-1", currency: "EUR" }
        ) {
          updateArtworkImportV2OrError {
            ... on UpdateArtworkImportV2Success {
              artworkImport {
                internalID
                currency
              }
            }
          }
        }
      }
    `

    const context = { artworkImportV2UpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        currency: "EUR",
      }
    )

    expect(result).toEqual({
      updateArtworkImportV2: {
        updateArtworkImportV2OrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            currency: "EUR",
          },
        },
      },
    })
  })

  it("updates multiple properties at once", async () => {
    const artworkImportV2UpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      currency: "EUR",
      dimension_metric: "cm",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportV2(
          input: {
            artworkImportID: "artwork-import-1"
            currency: "EUR"
            dimensionMetric: "cm"
          }
        ) {
          updateArtworkImportV2OrError {
            ... on UpdateArtworkImportV2Success {
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = { artworkImportV2UpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        currency: "EUR",
        dimension_metric: "cm",
      }
    )

    expect(result).toEqual({
      updateArtworkImportV2: {
        updateArtworkImportV2OrError: {
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })
})
