import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkImportImageMatchV2Mutation", () => {
  it("removes image match successfully", async () => {
    const artworkImportV2RemoveImageMatchLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImageMatchV2(
          input: { artworkImportID: "artwork-import-1", imageID: "image-123" }
        ) {
          removeArtworkImportImageMatchV2OrError {
            ... on RemoveArtworkImportImageMatchV2Success {
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
      artworkImportV2RemoveImageMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2RemoveImageMatchLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", imageID: "image-123" },
      {}
    )

    expect(result).toEqual({
      removeArtworkImportImageMatchV2: {
        removeArtworkImportImageMatchV2OrError: {
          success: true,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles non-existent image ID gracefully", async () => {
    const artworkImportV2RemoveImageMatchLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImageMatchV2(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "non-existent-image"
          }
        ) {
          removeArtworkImportImageMatchV2OrError {
            ... on RemoveArtworkImportImageMatchV2Success {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2RemoveImageMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      removeArtworkImportImageMatchV2: {
        removeArtworkImportImageMatchV2OrError: {
          success: true,
        },
      },
    })
  })
})
