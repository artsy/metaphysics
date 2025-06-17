import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("FlagArtworkImportCellMutation", () => {
  it("flags a cell", async () => {
    const artworkImportFlagCellLoader = jest.fn().mockResolvedValue({
      artworkImportID: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        flagArtworkImportCell(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-1"
            columnName: "title"
            userNote: "This title needs review"
            flaggedValue: "Hallucinated title"
            originalValue: "Original Title"
          }
        ) {
          flagArtworkImportCellOrError {
            ... on FlagArtworkImportCellSuccess {
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const context = {
      artworkImportFlagCellLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportFlagCellLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        row_id: "row-1",
        column_name: "title",
        user_note: "This title needs review",
        flagged_value: "Hallucinated title",
        original_value: "Original Title",
      }
    )

    expect(result).toEqual({
      flagArtworkImportCell: {
        flagArtworkImportCellOrError: {
          artworkImport: {
            internalID: "artwork-import-id",
          },
        },
      },
    })
  })
})
