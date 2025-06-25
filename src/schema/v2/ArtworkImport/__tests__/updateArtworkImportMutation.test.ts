import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportMutation", () => {
  it("updates an artwork import successfully", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(input: { currency: "EUR", dimensionMetric: "cm" }) {
          artworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
                fileName
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith({
      currency: "EUR",
      dimensionMetric: "cm",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        artworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            fileName: "import.csv",
          },
        },
      },
    })
  })
})
