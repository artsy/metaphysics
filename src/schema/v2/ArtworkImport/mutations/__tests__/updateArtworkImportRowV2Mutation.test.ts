import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowV2Mutation", () => {
  it("updates a row field successfully", async () => {
    const artworkImportV2UpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            fieldName: "ArtworkTitle"
            fieldValue: "New Title"
          }
        ) {
          updateArtworkImportRowV2OrError {
            ... on UpdateArtworkImportRowV2Success {
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
      artworkImportV2UpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        field_name: "ArtworkTitle",
        field_value: "New Title",
      }
    )

    expect(result).toEqual({
      updateArtworkImportRowV2: {
        updateArtworkImportRowV2OrError: {
          artworkImportID: "artwork-import-1",
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("toggles row exclusion successfully", async () => {
    const artworkImportV2UpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            excludedFromImport: true
          }
        ) {
          updateArtworkImportRowV2OrError {
            ... on UpdateArtworkImportRowV2Success {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2UpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        excluded_from_import: true,
      }
    )

    expect(result).toEqual({
      updateArtworkImportRowV2: {
        updateArtworkImportRowV2OrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("updates field and exclusion simultaneously", async () => {
    const artworkImportV2UpdateRowLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowV2(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-123"
            fieldName: "ArtworkTitle"
            fieldValue: "Updated Title"
            excludedFromImport: false
          }
        ) {
          updateArtworkImportRowV2OrError {
            ... on UpdateArtworkImportRowV2Success {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2UpdateRowLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2UpdateRowLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-123" },
      {
        field_name: "ArtworkTitle",
        field_value: "Updated Title",
        excluded_from_import: false,
      }
    )

    expect(result).toEqual({
      updateArtworkImportRowV2: {
        updateArtworkImportRowV2OrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })
})
