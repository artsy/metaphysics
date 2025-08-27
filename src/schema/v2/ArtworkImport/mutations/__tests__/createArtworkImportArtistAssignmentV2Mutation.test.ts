import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtistAssignmentV2Mutation", () => {
  it("creates artist assignment successfully", async () => {
    const artworkImportV2CreateArtistAssignmentLoader = jest
      .fn()
      .mockResolvedValue({
        updated_rows_count: 3,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistAssignmentV2(
          input: {
            artworkImportID: "artwork-import-1"
            artistName: "Unknown Artist"
            artistID: "artist-123"
          }
        ) {
          createArtworkImportArtistAssignmentV2OrError {
            ... on CreateArtworkImportArtistAssignmentV2Success {
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
      artworkImportV2CreateArtistAssignmentLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateArtistAssignmentLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        artist_name: "Unknown Artist",
        artist_id: "artist-123",
      }
    )

    expect(result).toEqual({
      createArtworkImportArtistAssignmentV2: {
        createArtworkImportArtistAssignmentV2OrError: {
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
    const artworkImportV2CreateArtistAssignmentLoader = jest
      .fn()
      .mockResolvedValue({
        updated_rows_count: 0,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistAssignmentV2(
          input: {
            artworkImportID: "artwork-import-1"
            artistName: "Non-existent Artist"
            artistID: "artist-456"
          }
        ) {
          createArtworkImportArtistAssignmentV2OrError {
            ... on CreateArtworkImportArtistAssignmentV2Success {
              updatedRowsCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateArtistAssignmentLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtistAssignmentV2: {
        createArtworkImportArtistAssignmentV2OrError: {
          updatedRowsCount: 0,
        },
      },
    })
  })
})
