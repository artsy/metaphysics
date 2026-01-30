import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteArtworkImportMutation", () => {
  it("queues an artwork import deletion job", async () => {
    const deleteArtworkImportLoader = jest.fn().mockResolvedValue({
      queued: true,
    })

    const mutation = gql`
      mutation {
        deleteArtworkImport(input: { artworkImportID: "artwork-import-1" }) {
          artworkImportOrError {
            ... on DeleteArtworkImportSuccess {
              queued
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
          queued: true,
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
