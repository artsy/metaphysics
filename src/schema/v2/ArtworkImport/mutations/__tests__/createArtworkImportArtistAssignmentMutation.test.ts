import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtistAssignmentMutation", () => {
  it("creates artist assignment successfully", async () => {
    const artworkImportCreateArtistAssignmentLoader = jest
      .fn()
      .mockResolvedValue({
        updated_rows_count: 3,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistAssignment(
          input: {
            artworkImportID: "artwork-import-1"
            artistName: "Unknown Artist"
            artistID: "artist-123"
          }
        ) {
          createArtworkImportArtistAssignmentOrError {
            ... on CreateArtworkImportArtistAssignmentSuccess {
              artworkImportID
              updatedRowsCount
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtistAssignmentLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtistAssignmentLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        artist_name: "Unknown Artist",
        artist_id: "artist-123",
      }
    )

    expect(result).toEqual({
      createArtworkImportArtistAssignment: {
        createArtworkImportArtistAssignmentOrError: {
          artworkImportID: "artwork-import-1",
          updatedRowsCount: 3,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles zero rows updated", async () => {
    const artworkImportCreateArtistAssignmentLoader = jest
      .fn()
      .mockResolvedValue({
        updated_rows_count: 0,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistAssignment(
          input: {
            artworkImportID: "artwork-import-1"
            artistName: "Non-existent Artist"
            artistID: "artist-456"
          }
        ) {
          createArtworkImportArtistAssignmentOrError {
            ... on CreateArtworkImportArtistAssignmentSuccess {
              updatedRowsCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtistAssignmentLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtistAssignment: {
        createArtworkImportArtistAssignmentOrError: {
          updatedRowsCount: 0,
        },
      },
    })
  })
})
