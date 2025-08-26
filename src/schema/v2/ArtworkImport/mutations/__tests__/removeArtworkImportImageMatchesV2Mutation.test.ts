import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkImportImageMatchesV2Mutation", () => {
  it("removes image match successfully", async () => {
    const artworkImportV2RemoveImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        success: true,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImageMatchesV2(
          input: { artworkImportID: "artwork-import-1", imageID: "image-123" }
        ) {
          removeArtworkImportImageMatchesV2OrError {
            ... on RemoveArtworkImportImageMatchesV2Success {
              success
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2RemoveImageMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2RemoveImageMatchesLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", imageID: "image-123" },
      {}
    )

    expect(result).toEqual({
      removeArtworkImportImageMatchesV2: {
        removeArtworkImportImageMatchesV2OrError: {
          success: true,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles non-existent image ID gracefully", async () => {
    const artworkImportV2RemoveImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        success: true,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImageMatchesV2(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "non-existent-image"
          }
        ) {
          removeArtworkImportImageMatchesV2OrError {
            ... on RemoveArtworkImportImageMatchesV2Success {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2RemoveImageMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      removeArtworkImportImageMatchesV2: {
        removeArtworkImportImageMatchesV2OrError: {
          success: true,
        },
      },
    })
  })
})
