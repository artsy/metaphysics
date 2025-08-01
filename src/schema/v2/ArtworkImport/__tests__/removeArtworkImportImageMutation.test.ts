import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkImportImageMutation", () => {
  it("removes an image from artwork import", async () => {
    const artworkImportRemoveImageLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImage(
          input: { artworkImportID: "artwork-import-1", imageID: "image-123" }
        ) {
          removeArtworkImportImageOrError {
            ... on RemoveArtworkImportImageSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportRemoveImageLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportRemoveImageLoader).toHaveBeenCalledWith({
      artworkImportID: "artwork-import-1",
      imageID: "image-123",
    })

    expect(result).toEqual({
      removeArtworkImportImage: {
        removeArtworkImportImageOrError: {
          success: true,
        },
      },
    })
  })

  it("handles errors when removing an image", async () => {
    const artworkImportRemoveImageLoader = jest.fn().mockRejectedValue({
      body: {
        error: "Image not found",
      },
    })

    const mutation = gql`
      mutation {
        removeArtworkImportImage(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "nonexistent-image"
          }
        ) {
          removeArtworkImportImageOrError {
            ... on RemoveArtworkImportImageFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportRemoveImageLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportRemoveImageLoader).toHaveBeenCalledWith({
      artworkImportID: "artwork-import-1",
      imageID: "nonexistent-image",
    })

    expect(result).toEqual({
      removeArtworkImportImage: {
        removeArtworkImportImageOrError: {
          mutationError: {
            message: "Image not found",
          },
        },
      },
    })
  })
})
