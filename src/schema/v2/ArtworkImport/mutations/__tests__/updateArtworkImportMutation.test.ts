import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportMutation", () => {
  it("updates artwork import status successfully", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      state: "canceled",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(
          input: { artworkImportID: "artwork-import-1", status: "cancelled" }
        ) {
          updateArtworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
                state
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith("artwork-import-1", {
      status: "cancelled",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        updateArtworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            state: "CANCELED",
          },
        },
      },
    })
  })

  it("updates artwork import currency successfully", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      currency: "EUR",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(
          input: { artworkImportID: "artwork-import-1", currency: "EUR" }
        ) {
          updateArtworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
                currency
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith("artwork-import-1", {
      currency: "EUR",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        updateArtworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            currency: "EUR",
          },
        },
      },
    })
  })

  it("updates multiple properties at once", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      currency: "EUR",
      dimension_metric: "cm",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(
          input: {
            artworkImportID: "artwork-import-1"
            currency: "EUR"
            dimensionMetric: "cm"
            locationID: "location-123"
          }
        ) {
          updateArtworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith("artwork-import-1", {
      currency: "EUR",
      dimension_metric: "cm",
      location_id: "location-123",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        updateArtworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("updates location ID", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(
          input: {
            artworkImportID: "artwork-import-1"
            locationID: "location-456"
          }
        ) {
          updateArtworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith("artwork-import-1", {
      location_id: "location-456",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        updateArtworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })
})
