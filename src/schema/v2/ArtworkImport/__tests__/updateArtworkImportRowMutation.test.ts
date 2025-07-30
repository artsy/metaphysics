import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowMutation", () => {
  it("updates a row", async () => {
    const artworkImportUpdateRowLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRow(
          input: {
            artworkImportID: "artwork-import-1"
            artworkImportRowID: "row-1"
            fieldName: "ArtistNames"
            fieldValue: "Andy Warhol"
          }
        ) {
          updateArtworkImportRowOrError {
            ... on UpdateArtworkImportRowSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateRowLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-1",
        field_name: "ArtistNames",
        field_value: "Andy Warhol",
      }
    )

    expect(result).toEqual({
      updateArtworkImportRow: {
        updateArtworkImportRowOrError: {
          success: true,
        },
      },
    })
  })

  it("updates a row with null fieldValue", async () => {
    const artworkImportUpdateRowLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRow(
          input: {
            artworkImportID: "artwork-import-1"
            artworkImportRowID: "row-1"
            fieldName: "ArtistNames"
            fieldValue: null
          }
        ) {
          updateArtworkImportRowOrError {
            ... on UpdateArtworkImportRowSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateRowLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-1",
        field_name: "ArtistNames",
        field_value: null,
      }
    )

    expect(result).toEqual({
      updateArtworkImportRow: {
        updateArtworkImportRowOrError: {
          success: true,
        },
      },
    })
  })
})
