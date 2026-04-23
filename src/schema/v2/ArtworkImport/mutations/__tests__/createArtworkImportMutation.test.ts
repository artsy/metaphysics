import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportMutation", () => {
  it("passes partnerListID to gravity", async () => {
    const createArtworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      file_name: "import.csv",
      partner_list_id: "list-123",
    })

    const mutation = gql`
      mutation {
        createArtworkImport(
          input: {
            partnerID: "partner-1"
            s3Key: "/some/path/uuid.csv"
            s3Bucket: "someBucket"
            partnerListID: "list-123"
          }
        ) {
          artworkImportOrError {
            ... on CreateArtworkImportSuccess {
              artworkImport {
                internalID
                partnerListID
              }
            }
          }
        }
      }
    `

    const context = { createArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(createArtworkImportLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        partner_list_id: "list-123",
      })
    )

    expect(result).toEqual({
      createArtworkImport: {
        artworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            partnerListID: "list-123",
          },
        },
      },
    })
  })

  it("creates an artwork import successfully", async () => {
    const createArtworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      file_name: "import.csv",
    })

    const mutation = gql`
      mutation {
        createArtworkImport(
          input: {
            partnerID: "partner-1"
            s3Key: "/some/path/uuid.csv"
            s3Bucket: "someBucket"
            fileName: "import.csv"
          }
        ) {
          artworkImportOrError {
            ... on CreateArtworkImportSuccess {
              artworkImport {
                internalID
                fileName
              }
            }
          }
        }
      }
    `

    const context = { createArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(createArtworkImportLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      s3_key: "/some/path/uuid.csv",
      s3_bucket: "someBucket",
      file_name: "import.csv",
      source: "bulk_import",
    })

    expect(result).toEqual({
      createArtworkImport: {
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
