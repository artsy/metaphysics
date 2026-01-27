import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteArtworkImportMutation", () => {
  it("deletes an artwork import successfully", async () => {
    const deleteArtworkImportLoader = jest.fn().mockResolvedValue({
      success: true,
      deleted_artworks_count: 2,
      deleted_sale_artworks_count: 1,
      deleted_artwork_ids: ["artwork-1", "artwork-2"],
      deleted_sale_artwork_ids: [1, 2],
      import_canceled: true,
      errors: [],
    })

    const mutation = gql`
      mutation {
        deleteArtworkImport(input: { artworkImportID: "artwork-import-1" }) {
          artworkImportOrError {
            ... on DeleteArtworkImportSuccess {
              success
              deletedArtworksCount
              deletedSaleArtworksCount
              deletedArtworkIds
              deletedSaleArtworkIds
              importCanceled
              errors
            }
          }
        }
      }
    `

    const context = { deleteArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(deleteArtworkImportLoader).toHaveBeenCalledWith("artwork-import-1")

    expect(result).toEqual({
      deleteArtworkImport: {
        artworkImportOrError: {
          success: true,
          deletedArtworksCount: 2,
          deletedSaleArtworksCount: 1,
          deletedArtworkIds: ["artwork-1", "artwork-2"],
          deletedSaleArtworkIds: [1, 2],
          importCanceled: true,
          errors: [],
        },
      },
    })
  })

  it("handles errors gracefully", async () => {
    const deleteArtworkImportLoader = jest.fn().mockRejectedValue({
      body: {
        type: "param_error",
        message: "Artwork import not found",
      },
    })

    const mutation = gql`
      mutation {
        deleteArtworkImport(input: { artworkImportID: "invalid-id" }) {
          artworkImportOrError {
            ... on DeleteArtworkImportFailure {
              mutationError {
                type
                message
              }
            }
          }
        }
      }
    `

    const context = { deleteArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deleteArtworkImport: {
        artworkImportOrError: {
          mutationError: {
            type: "param_error",
            message: "Artwork import not found",
          },
        },
      },
    })
  })
})
