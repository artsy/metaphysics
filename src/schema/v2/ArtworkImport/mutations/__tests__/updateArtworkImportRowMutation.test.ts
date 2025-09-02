import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowMutation", () => {
  it("updates a row field successfully", async () => {
    const artworkImportUpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRow(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            fieldName: "ArtworkTitle"
            fieldValue: "New Title"
          }
        ) {
          updateArtworkImportRowOrError {
            ... on UpdateArtworkImportRowSuccess {
              artworkImportID
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        field_name: "ArtworkTitle",
        field_value: "New Title",
      }
    )

    expect(result).toEqual({
      updateArtworkImportRow: {
        updateArtworkImportRowOrError: {
          artworkImportID: "artwork-import-1",
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("toggles row exclusion successfully", async () => {
    const artworkImportUpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRow(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            excludedFromImport: true
          }
        ) {
          updateArtworkImportRowOrError {
            ... on UpdateArtworkImportRowSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        excluded_from_import: true,
      }
    )

    expect(result).toEqual({
      updateArtworkImportRow: {
        updateArtworkImportRowOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("updates field and exclusion simultaneously", async () => {
    const artworkImportUpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRow(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            fieldName: "ArtworkTitle"
            fieldValue: "Updated Title"
            excludedFromImport: false
          }
        ) {
          updateArtworkImportRowOrError {
            ... on UpdateArtworkImportRowSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        field_name: "ArtworkTitle",
        field_value: "Updated Title",
        excluded_from_import: false,
      }
    )

    expect(result).toEqual({
      updateArtworkImportRow: {
        updateArtworkImportRowOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })
})
