import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportCellFlagV2Mutation", () => {
  it("creates cell flag successfully", async () => {
    const artworkImportV2CreateCellFlagLoader = jest.fn().mockResolvedValue({
      id: "cell-flag-1",
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportCellFlagV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            columnName: "ArtworkTitle"
            flaggedValue: "Suspicious Title"
            originalValue: "Original Title"
            userNote: "This looks AI-generated"
          }
        ) {
          createArtworkImportCellFlagV2OrError {
            ... on CreateArtworkImportCellFlagV2Success {
              success
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateCellFlagLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateCellFlagLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-123",
        column_name: "ArtworkTitle",
        flagged_value: "Suspicious Title",
        original_value: "Original Title",
        user_note: "This looks AI-generated",
      }
    )

    expect(result).toEqual({
      createArtworkImportCellFlagV2: {
        createArtworkImportCellFlagV2OrError: {
          success: true,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("creates cell flag with minimal data", async () => {
    const artworkImportV2CreateCellFlagLoader = jest.fn().mockResolvedValue({
      id: "cell-flag-2",
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportCellFlagV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-456"
            columnName: "Artist"
            flaggedValue: "Unknown Artist"
          }
        ) {
          createArtworkImportCellFlagV2OrError {
            ... on CreateArtworkImportCellFlagV2Success {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateCellFlagLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateCellFlagLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-456",
        column_name: "Artist",
        flagged_value: "Unknown Artist",
      }
    )

    expect(result).toEqual({
      createArtworkImportCellFlagV2: {
        createArtworkImportCellFlagV2OrError: {
          success: true,
        },
      },
    })
  })

  it("creates cell flag with user note only", async () => {
    const artworkImportV2CreateCellFlagLoader = jest.fn().mockResolvedValue({
      id: "cell-flag-3",
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportCellFlagV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-789"
            columnName: "Price"
            flaggedValue: "$1,000,000"
            userNote: "Price seems too high for this artist"
          }
        ) {
          createArtworkImportCellFlagV2OrError {
            ... on CreateArtworkImportCellFlagV2Success {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateCellFlagLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateCellFlagLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-789",
        column_name: "Price",
        flagged_value: "$1,000,000",
        user_note: "Price seems too high for this artist",
      }
    )

    expect(result).toEqual({
      createArtworkImportCellFlagV2: {
        createArtworkImportCellFlagV2OrError: {
          success: true,
        },
      },
    })
  })
})
